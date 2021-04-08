'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')
const { generateHash } = require('utils/functions/auth')

const { dealDB, userDB, progressDB, callDB } = require('../db')

const courseFunc = require('utils/functions/course')
const { payloadToData } = require('utils/functions/user')
const { getBase64 } = require('utils/functions/base64')
const { createTimeline } = require('./timeline')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const { MEDIA_PATH } = require('utils/files/path')
const { createEmail } = require('./email')
const { getSocket } = require('../lib/io')
const { createNewUser, createEnrolUser, searchUser } = require('./moodle')

let randomize = require('randomatic')

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

  const updateDeal = await dealDB.update(dealId, dataDeal)

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
  // console.log('deal', deal)
  if (deal) {
    // console.log('actualizo deal')
    const updateDeal = await editExistDeal(deal.toJSON(), user, body)
    return updateDeal
  } else {
    const deal = await createNewDeal(user, body)
    // console.log('creo deal', deal)
    createTimeline({ linked: user, deal:deal, type: 'Deal', name: 'Nuevo trato creado' })
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
  if (body.assessor && body.assessor.username) {
    dataDeal.assessor.username = body.assessor.username
    dataDeal.assessor.ref = await assignedAssessorOne(body.assessor.username)
  } else {
    dataDeal.assessor = await assignedAssessor(body.courses)
  }

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
  prepareCourses(user, deal.toJSON(), [], body.courses, body.source)
  incProspects(dataDeal)
  return deal
}

const editExistDeal = async (deal, user, body) => {
  const dataDeal = await addInitialStatus(deal)
  if (!dataDeal.assessor) {
    dataDeal.assessor = await assignedAssessor(body.courses)
    incProspects(dataDeal)
  }
  // console.log('deal prepare', deal)
  // console.log('body.courses', body.courses)
  // console.log('dataDeal.students[0].courses', dataDeal.students[0].courses)
  dataDeal.students[0]
    ? (dataDeal.students[0].courses = prepareCourses(
        user,
        dataDeal,
        dataDeal.students[0].courses,
        body.courses,
        body.source
      ))
    : {
        ...dataDeal,
        client: user,
        students: [
          {
            student: user,
            courses: prepareCourses(user, dataDeal, [], body.courses, body.source)
          }
        ]
    }
  // console.log('dataDeal', dataDeal)
  const updateDeal = await dealDB.update(deal._id, {
    ...dataDeal
  })
  // console.log('updateDeal', updateDeal)
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

const assignedAssessorOne = async username => {
  const assessor = await userDB.detail({
    query: {
      roles: 'Asesor',
      username: username
    }
  })

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

const prepareCourses = (lead, deal, oldCourses, newCourses, source = 'Sitio web') => {
  const courses = oldCourses.filter(course => {
    const index = newCourses.findIndex(item => {
      // console.log('item._id.toString()', item._id.toString())
      // console.log('course._id.toString()', course._id.toString())
      return item.ref && item.ref.toString() === course.ref && course.ref.toString() || item._id && item._id.toString() === course._id && course._id.toString()
    })
    return index === -1
  })
  newCourses.forEach(course => {
    // console.log('course', course)
    setTimeout(() => {
      // console.log('prepare lead', deal.assessor)
      createTimeline({
        linked: lead,
        assigned: deal.assessor,
        deal: deal,
        type: 'Curso',
        name: `Solicito información del ${course.name} por ${source}`
      })
      sendEmailCourse(lead, deal, course, true)
    }, 2000)
  })
  return [...newCourses, ...courses]
}


const sendEmailCourse = async (lead, deal, dataCourse, social = false) => {
  const linked = payloadToData(lead)
  const assigned = deal.assessor
  const course = social ? dataCourse : courseFunc.payloadToData(dataCourse)
  const to = linked.email
  const from = 'cursos@eai.edu.pe'
  const fromname = 'Escuela Americana de Innovación'
  const templateId = 'd-fe5148580749466aa59f69e5eab99c9a'
  const preheader = `Información del curso ${course.name}`
  const content =
    'Se envio informacion del curso de la plantilla pre definida en sengrid.'
  const attachment = await getBase64(MEDIA_PATH + course.brochure)
  const filename = course && 'Brochure - ' + course.name

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
      fromname,
      preheader,
      content,
      attachment,
      filename,
      deal: deal._id
    })
    sendMailTemplate({
      to,
      from,
      fromname,
      attachment,
      filename,
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
    shortName: course.shortName,
    inicio: course.startCourse ? course.startCourse : moment().add(7, 'days').format('LL'),
    precio: course.price,
    precio_oferta: course.priceOffert,
    horas: course.academicHours,
    brochure: MEDIA_PATH + course.brochure,
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

const addCoursesMoodle = async (student, courses, dealId, logged) => {
  const deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })

  let user = await userDB.detail({
    query: { _id: student._id }
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
    deal: deal,
    type: 'Curso'
  }
  const code = randomize('0', 8)
  if (!user.moodleId) {
    // console.log('registrar usuario moodle')
    const exist = await searchUser({
      username: user.username,
      email: user.email
    })
    // console.log('exist', exist)
    if (exist && exist.user) {
      const err = {
        status: 402,
        message: `Ya existe un usuario con el mismo ${exist.type}`
      }
      throw err
    }
    
    const moodleUser = await createNewUser({
      ...user.toJSON(),
      username: student.username,
      password: code
    })
    
    const dataUser = {
      username: student.username || undefined,
      password: student.password ? generateHash(code) : undefined,
      moodleId: moodleUser.id
    }
    user = await userDB.update(user._id, dataUser)
    user.password = code
    createTimeline({
      ...timeline,
      type: 'Cuenta',
      name: '[Cuenta] se creó la cuenta en Moodle'
    })
    
    sendEmailAccess(user.toJSON(), logged)
  }
  // console.log('registro de cursos')
  try {
    const coursesEnrol = await Promise.all(
      courses.map(async course => {
        user.password = code
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
    return coursesEnrol
  } catch (error) {
    // console.log('error', error)
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
  const fromname = 'Escuela Americana de Innovación'
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-1283b20fdf3b411a861b30dac8082bd8'
  const preheader = 'Accesos a Moodle'
  const content =
    'Se envio la información de accesos a la cuneta de moodle con la plantilla pre definida en sengrid.'
  const substitutions = {
    username: linked.username,
    password: user.password,
    name: linked.names
  }
  console.log('substitutions', substitutions)
  try {
    const email = await createEmail({
      linked,
      assigned,
      from,
      fromname,
      preheader,
      content
    })
    sendMailTemplate({
      to,
      from,
      fromname,
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

const enrolStudents = async ({ students, dealId }, logged) => {
  //const deal = await dealDB.detail({ query: { _id: dealId } })
  const enrols = await Promise.all(
    students.map(async item => {
      const courses = await addCoursesMoodle(
        item.student,
        item.courses,
        dealId,
        logged
      )
      return courses
    })
  )

  const updatedDeal = await dealDB.update(dealId, {
    isClosed: true,
    endDate: new Date()
  })
  emitDeal(updatedDeal)
  return { enrols, updatedDeal }
}

module.exports = {
  countDocuments,
  listDeals,
  createDeal,
  updateDeal,
  detailDeal,
  deleteDeal,
  createOrUpdateDeal,
  emitDeal,
  enrolStudents
}
