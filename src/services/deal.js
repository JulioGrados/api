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

const listDeals = async params => {
  const deals = await dealDB.list(params)
  return deals
}

const createDeal = async body => {
  const deal = await dealDB.create(body)
  return deal
}

const updateDeal = async (dealId, body, loggedUser) => {
  const deal = await dealDB.detail({ query: { _id: dealId } })
  const dataDeal = await changeStatus(body, deal)
  const updateDeal = await dealDB.update(dealId, dataDeal)
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
  try {
    const deal = await dealDB.detail({
      query: {
        'linked.ref': user._id,
        status: 'Abierto'
      },
      populate: {
        path: 'assessor.ref'
      }
    })
    const updateDeal = await editExistDeal(deal, user, body)
    return updateDeal
  } catch (error) {
    if (error.status === 404) {
      const deal = createNewDeal(user, body)
      createTimeline({ linked: user, type: 'Deal', name: 'Nuevo trato creado' })
      return deal
    } else {
      throw error
    }
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
  const updateDeal = await userDB.update(deal._id, {
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
      role: 'assessor',
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
    query: { role: 'assessor' },
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
      content
    })
    console.log('email', email)
    console.log('substitutions', substitutions)
    console.log('to', to)
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
    dataDeal.progress = await changeStatusProgress('lost', dataDeal)
    dataDeal.isClosed = true
    dataDeal.statusActivity = 'done'
    dataDeal.status = 'Perdido'
    decProspects(deal)
  }
  if (deal.status !== 'Abierto' && dataDeal.status === 'Abierto') {
    dataDeal.statusProgress = await changeStatusProgress('initial', dataDeal)
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
    console.log(oldRef, newRef)
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
