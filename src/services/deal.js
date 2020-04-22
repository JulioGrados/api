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
    const existDeal = await findDealUser(body.linked.ref)
    if (existDeal) {
      const error = {
        status: 402,
        message: 'Ya existe un trato abierto para el usuario.'
      }
      throw error
    }
  } else if (body.status === 'Perdido') {
    body.isClosed = true
  } else if (body.status === 'Ganado') {
    if (!body.linked.moodleId) {
      const error = {
        status: 402,
        message: 'El usuario debe ser cliente en moodle'
      }
      throw error
    }
  }
  const deal = await dealDB.create(body)

  if (deal.status === 'Ganado') {
    await addCoursesMoodle(deal, body.linked, loggedUser)
  }

  return deal
}

const updateDeal = async (dealId, body, loggedUser) => {
  const deal = await dealDB.detail({ query: { _id: dealId } })
  const dataDeal = await changeStatus(body, deal)
  const updateDeal = await dealDB.update(dealId, dataDeal)
  if (deal.status !== 'Ganado' && updateDeal.status === 'Ganado') {
    await addCoursesMoodle(deal, updateDeal.linked, loggedUser)
  }
  if (deal.addMoodle) {
    addCoursesMoodle(deal, body, loggedUser)
  }
  timelineProgress(updateDeal.toJSON(), deal.toJSON(), loggedUser, body)
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
  const deal = await findDealUser(user._id)
  if (deal) {
    const updateDeal = await editExistDeal(deal.toJSON(), user, body)
    return updateDeal
  } else {
    const deal = createNewDeal(user, body)
    createTimeline({ linked: user, type: 'Deal', name: 'Nuevo trato creado' })
    return deal
  }
}

const findDealUser = async userId => {
  try {
    const deal = await dealDB.detail({
      query: {
        'linked.ref': userId,
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
  dataDeal.assessor = await assignedAssessor(dataDeal)
  const deal = await dealDB.create({
    ...dataDeal,
    linked: {
      ...user,
      ref: user._id
    }
  })
  emitDeal(deal)
  addCall(user, deal, deal.courses)
  prepareCourses(user, deal.toJSON(), [], body.courses)
  incProspects(dataDeal)
  return deal
}

const editExistDeal = async (deal, user, body) => {
  const dataDeal = await addInitialStatus(deal)
  if (!dataDeal.assessor) {
    dataDeal.assessor = await assignedAssessor(dataDeal)
    incProspects(dataDeal)
  }
  dataDeal.courses = prepareCourses(user, dataDeal, deal.courses, body.courses)
  const updateDeal = await dealDB.update(deal._id, {
    ...dataDeal,
    linked: {
      ...user,
      ref: user._id
    }
  })
  emitDeal(updateDeal)
  addCall(user, updateDeal, body.courses)
  return updateDeal
}

const addInitialStatus = async deal => {
  deal.progress = await changeStatusProgress('initial', deal)
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

const assignedAssessor = async deal => {
  const coursesId = deal.courses.map(course => course._id)
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

const addCall = async (lead, deal, courses) => {
  const coursesName = courses.map(course => course.name).join(', ')
  const dataCall = {
    name: `Llamada de contacto [${coursesName}]`,
    hour: moment()
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(),
    assigned: deal.assessor,
    linked: {
      names: lead.names,
      ref: lead._id
    },
    deal: deal._id
  }
  try {
    const call = await callDB.create(dataCall)
    emitCall(call)
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

const changeStatus = async (dataDeal, deal) => {
  if (dataDeal.status === 'Perdido') {
    dataDeal.isClosed = true
    dataDeal.statusActivity = 'done'
    dataDeal.status = 'Perdido'
    decProspects(deal)
  }
  if (deal.status !== 'Abierto' && dataDeal.status === 'Abierto') {
    dataDeal.isClosed = false
    dataDeal.statusActivity = 'todo'
    dataDeal.status = 'Abierto'
    incProspects(deal)
  }
  return dataDeal
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

const timelineProgress = (updateDeal, deal, assigned, body) => {
  if (updateDeal.progress && deal.progress) {
    const oldRef = deal.progress.ref.toString()
    const oldName = deal.progress.name
    const newRef = updateDeal.progress.ref.toString()
    const newName = updateDeal.progress.name
    if (oldRef !== newRef) {
      if (updateDeal.status === 'Perdido') {
        createTimeline({
          linked: updateDeal.linked,
          assigned,
          type: 'Deal',
          name: `[Trato Perdido] ${body.lostReason}`,
          note: body.lostNote
        })
      } else {
        createTimeline({
          linked: updateDeal.linked,
          assigned,
          type: 'Etapa',
          name: `${oldName} → ${newName}`
        })
      }
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
        assigned,
        type: 'Etapa',
        name: `${oldName} → ${newName}`
      })
    }
  }
}

const addCoursesMoodle = async (deal, data, logged) => {
  const user = await userDB.detail({ query: { _id: deal.linked.ref } })
  const timeline = {
    linked: deal.linked,
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
    console.log('courses', courses)
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
