'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')

const { dealDB, userDB, progressDB, callDB } = require('../db')

const courseFunc = require('utils/functions/course')
const { payloadToData } = require('utils/functions/user')
const { createTimeline } = require('./timeline')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const { createEmail } = require('./email')
const { getSocket } = require('../lib/io')
const { createNewUser, createEnrolUser, searchUser } = require('./moodle')

const listDeals = async params => {
  const deals = await dealDB.list(params)
  return deals
}

const createDeal = async (body, loggedUser) => {
  if (body.status === 'Abierto') {
    const existDeal = await findDealUser(body.client)
    if (existDeal) {
      const error = {
        status: 402,
        message: 'Ya existe un trato abierto para el cliente.'
      }
      throw error
    }
  } else if (body.status === 'Perdido') {
    body.isClosed = true
    body.endDate = Date()
  } else if (body.status === 'Ganado') {
    if (!body.client.moodleId) {
      const error = {
        status: 402,
        message: 'El usuario debe ser cliente en moodle'
      }
      throw error
    }
  }
  const deal = await dealDB.create(body)

  if (deal.status === 'Ganado') {
    await addCoursesMoodle(deal, body.client, loggedUser)
  }

  return deal
}

const updateDeal = async (dealId, body, loggedUser) => {
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  const dataDeal = await changeStatus(body, deal, loggedUser, body)
  if (
    deal.status !== 'Ganado' &&
    body.status === 'Ganado' &&
    !body.client.moodleId &&
    !body.client.password
  ) {
    const error = {
      status: 402,
      message: 'El usuario debe tener una contraseña o ser cliente en moodle'
    }
    throw error
  }
  const updateDeal = await dealDB.update(dealId, dataDeal)
  if (
    (deal.status !== 'Ganado' && updateDeal.status === 'Ganado') ||
    deal.addMoodle
  ) {
    await addCoursesMoodle(deal, body.client, loggedUser)
  }
  timelineProgress(updateDeal.toJSON(), deal.toJSON(), loggedUser)
  return updateDeal
}

const detailDeal = async params => {
  const deal = await dealDB.detail(params)
  return deal
}

const deleteDeal = async dealId => {
  const deal = await dealDB.remove(dealId)
  return deal
}

const countDocuments = async params => {
  const count = await dealDB.count(params)
  return count
}

const createOrUpdateDeal = async (user, body) => {
  const deal = await findDealUser(user)
  if (deal) {
    const updateDeal = await editExistDeal(deal.toJSON(), user, body)
    return updateDeal
  } else {
    const deal = createNewDeal(user, body)
    createTimeline({ linked: user, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const findDealUser = async user => {
  try {
    const deal = await dealDB.detail({
      query: {
        client: user._id || user,
        status: 'Abierto'
      },
      populate: {
        path: 'assessor.ref'
      }
    })
    return deal
  } catch (error) {
    return null
  }
}

const createNewDeal = async (user, body) => {
  const dataDeal = await addInitialStatus(body)
  dataDeal.assessor = await assignedAssessor(body.courses)
  const deal = await dealDB.create({
    ...dataDeal,
    client: user,
    students: [
      {
        student: user,
        courses: body.courses
      }
    ]
  })
  emitDeal(deal)
  addCall(user, deal, body.courses)
  prepareCourses(user, deal.toJSON(), [], body.courses)
  incProspects(dataDeal)
  return deal
}

const editExistDeal = async (deal, user, body) => {
  const dataDeal = await addInitialStatus(deal)
  if (!dataDeal.assessor) {
    dataDeal.assessor = await assignedAssessor(body.courses)
    incProspects(dataDeal)
  }
  dataDeal.students[0]
    ? (dataDeal.students[0].courses = prepareCourses(
        user,
        dataDeal,
        dataDeal.students[0].courses,
        body.courses
      ))
    : {
        ...dataDeal,
        client: user,
        students: [
          {
            student: user,
            courses: prepareCourses(user, dataDeal, [], body.courses)
          }
        ]
      }
  const updateDeal = await dealDB.update(deal._id, {
    ...dataDeal
  })
  emitDeal(updateDeal)
  addCall(user, updateDeal)
  return updateDeal
}

const addInitialStatus = async deal => {
  if (!deal.progress) {
    deal.progress = await changeStatusProgress('initial', deal)
  }
  deal.isClosed = false
  deal.statusActivity = 'todo'
  deal.status = 'Abierto'

  return deal
}

const changeStatusProgress = async (key, data) => {
  try {
    const progressItem = await progressDB.detail({ query: { key } })
    const progress = {
      name: progressItem.name,
      ref: progressItem._id
    }
    return progress
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
    return data.progress
  }
}

const assignedAssessor = async courses => {
  const coursesId = courses.map(course => course._id)
  const assessors = await userDB.list({
    query: {
      roles: 'Asesor',
      sellCourses: {
        $elemMatch: {
          ref: { $in: coursesId }
        }
      }
    }
  })

  const assessorCourse = getMinAssessor(assessors)

  if (assessorCourse) {
    return assessorCourse
  }

  const allAssessors = await userDB.list({
    query: { roles: 'Asesor' },
    select: { username: 1, prospects: 1 }
  })

  const assessor = getMinAssessor(allAssessors)

  if (assessor) {
    return assessor
  } else {
    const error = {
      status: 500,
      message: 'No se encontro un asesor disponible'
    }
    throw error
  }
}

const getMinAssessor = assessors => {
  const min = _.minBy(assessors, 'prospects')

  if (min) {
    const assessor = {
      username: min.username,
      ref: min
    }

    return assessor
  } else {
    return null
  }
}

const addCall = async (client, deal) => {
  //const coursesName = courses.map(course => course.name).join(', ')
  const call = await callDB.detail({
    query: { deal: deal._id, isCompleted: false }
  })
  if (call) {
    return
  }
  const lastCall = await callDB.detail({
    query: { deal: deal._id },
    sort: '-createdAt'
  })
  const number = lastCall ? lastCall.number + 1 : 1
  const dataCall = {
    name: `Llamada ${number}`,
    number,
    hour: moment()
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(),
    assigned: deal.assessor,
    linked: {
      names: client.names,
      ref: client._id
    },
    deal: deal._id
  }
  try {
    const newCall = await callDB.create(dataCall)
    emitCall(newCall)
  } catch (error) {
    console.log('error save call', dataCall, error)
  }
}

const emitCall = call => {
  try {
    const io = getSocket()
    io.to(call.assigned.ref).emit('call', call)
  } catch (error) {
    console.log('error sockets', call, error)
  }
}

const emitDeal = deal => {
  try {
    const io = getSocket()
    const assessor = deal.assessor.ref._id
      ? deal.assessor.ref._id
      : deal.assessor.ref
    io.to(assessor).emit('deal', deal)
  } catch (error) {
    console.log('error sockets', deal, error)
  }
}

const prepareCourses = (lead, deal, oldCourses, newCourses) => {
  const courses = oldCourses.filter(course => {
    const index = newCourses.findIndex(item => {
      return item.ref.toString() === course.ref.toString()
    })
    return index === -1
  })
  newCourses.forEach(course => {
    setTimeout(() => {
      createTimeline({
        linked: lead,
        type: 'Curso',
        name: `Preguntó por el curso ${course.name}`
      })
      sendEmailCourse(lead, deal, course)
    }, 2000)
  })
  return [...newCourses, ...courses]
}

const sendEmailCourse = async (lead, deal, dataCourse) => {
  const linked = payloadToData(lead)
  const assigned = payloadToData(deal.assessor.ref)
  const course = courseFunc.payloadToData(dataCourse)
  const to = linked.email
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-fe5148580749466aa59f69e5eab99c9a'
  const preheader = `Información del curso ${course.name}`
  const content =
    'Se envio informacion del curso de la plantilla pre definida en sengrid.'
  const substitutions = getSubstitutions({
    course,
    linked,
    assigned
  })
  try {
    const email = await createEmail({
      linked,
      assigned,
      from,
      preheader,
      content,
      deal: deal._id
    })
    sendMailTemplate({
      to,
      from,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

const getSubstitutions = ({ course, linked, assigned }) => {
  const substitutions = {
    nombre: linked.shortName,
    username: linked.username,
    password: linked.password,
    curso: course.name,
    inicio: course.startCourse,
    precio: course.price,
    precio_oferta: course.priceOffert,
    horas: course.academicHours,
    brochure: course.brochureDrive,
    celular: assigned.mobile
  }

  return substitutions
}

const changeStatus = async (dataDeal, deal, assigned, body) => {
  try {
    if (dataDeal.status === 'Perdido') {
      dataDeal.isClosed = true
      dataDeal.statusActivity = 'done'
      dataDeal.status = 'Perdido'
      decProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Perdido] ${body.lostReason}`
      })
    }
    if (dataDeal.status === 'Pausado') {
      dataDeal.isClosed = true
      dataDeal.statusActivity = 'done'
      dataDeal.status = 'Pausado'
      decProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Pausado] ${body.pauseReason}`
      })
    }
    if (deal.status !== 'Abierto' && dataDeal.status === 'Abierto') {
      dataDeal.isClosed = false
      dataDeal.statusActivity = 'todo'
      dataDeal.status = 'Abierto'
      incProspects(deal)
      createTimeline({
        linked: deal.client,
        deal,
        assigned,
        type: 'Deal',
        name: `[Trato Reabierto]`
      })
    }
    return dataDeal
  } catch (error) {
    console.log(error)
    throw error
  }
}

const incProspects = async deal => {
  try {
    await userDB.update(deal.assessor.ref, { $inc: { prospects: 1 } })
  } catch (error) {
    console.log('error inc prospects', deal.assessor, error)
  }
}

const decProspects = async deal => {
  try {
    await userDB.update(deal.assessor.ref, { $inc: { prospects: -1 } })
  } catch (error) {
    console.log('error dec prospects', deal.assessor, error)
  }
}

const timelineProgress = (updateDeal, deal, assigned) => {
  if (updateDeal.progress && deal.progress) {
    const oldRef = deal.progress.ref.toString()
    const oldName = deal.progress.name
    const newRef = updateDeal.progress.ref.toString()
    const newName = updateDeal.progress.name
    if (oldRef !== newRef) {
      createTimeline({
        linked: updateDeal.client,
        deal,
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
  if (updateDeal.progressPayment && deal.progressPayment) {
    const oldRef = deal.progressPayment.ref.toString()
    const oldName = deal.progressPayment.name
    const newRef = updateDeal.progressPayment.ref.toString()
    const newName = updateDeal.progressPayment.name
    if (oldRef !== newRef) {
      createTimeline({
        linked: updateDeal.linked,
        deal,
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
}

const addCoursesMoodle = async (deal, data, logged) => {
  const user = await userDB.detail({
    query: { _id: deal.client._id || deal.client }
  })
  const timeline = {
    linked: {
      ...user.toJSON(),
      ref: user._id
    },
    assigned: {
      username: logged.username,
      ref: logged._id
    },
    type: 'Curso'
  }
  if (!user.moodleId) {
    const exist = await searchUser({
      username: user.username,
      email: user.email
    })
    console.log(exist)
    if (exist && exist.user) {
      const err = {
        status: 402,
        message: `Ya existe un usuario con el mismo ${exist.type}`
      }
      throw err
    }
    const moodleUser = await createNewUser({
      ...user.toJSON(),
      username: data.username,
      password: data.password
    })
    console.log('moodleUser', moodleUser)
    const dataUser = {
      username: data.username || undefined,
      password: data.password ? generateHash(data.password) : undefined,
      moodleId: moodleUser.id
    }
    await userDB.update(user._id, dataUser)
    createTimeline({
      ...timeline,
      type: 'Cuenta',
      name: '[Cuenta] se creó la cuenta en Moodle'
    })
    sendEmailAccess(user, logged)
  }
  try {
    const courses = await Promise.all(
      deal.courses.map(async course => {
        await createEnrolUser({ course, user })
        createTimeline({
          ...timeline,
          name: `[Matricula] ${course.name}`
        })

        /*         if (course.changeActive) {
          console.log('cange')
          if (course.isEnrollActive) {
            createTimeline({
              ...timeline,
              name: `[Reactivación] ${course.name}`
            })
          } else {
            createTimeline({
              ...timeline,
              name: `[Suspensión] ${course.name}`
            })
          }
        } */
        return course
      })
    )
    return courses
  } catch (error) {
    if (error.status) {
      throw error
    } else {
      const err = {
        status: 500,
        message: 'Ocurrio un error al matricular en Moodle',
        error
      }
      throw err
    }
  }
}

const sendEmailAccess = async (user, logged) => {
  const linked = payloadToData(user)
  const assigned = payloadToData(logged)
  const to = user.email
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-1283b20fdf3b411a861b30dac8082bd8'
  const preheader = 'Accesos a Moodle'
  const content =
    'Se envio la información de accesos a la cuneta de moodle con la plantilla pre definida en sengrid.'
  const substitutions = {
    username: linked.username,
    password: linked.password,
    name: linked.shorName
  }
  try {
    const email = await createEmail({
      linked,
      assigned,
      from,
      preheader,
      content
    })
    sendMailTemplate({
      to,
      from,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

module.exports = {
  countDocuments,
  listDeals,
  createDeal,
  updateDeal,
  detailDeal,
  deleteDeal,
  createOrUpdateDeal,
  emitDeal
}
