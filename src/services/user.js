'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')

const { getSocket } = require('../lib/io')
const { userDB, progressDB, callDB } = require('../db')

const { createTimeline } = require('./timeline')
const { createEmail } = require('./email')

const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery, payloadToData } = require('utils/functions/user')
const courseFunc = require('utils/functions/course')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const { MEDIA_PATH } = require('utils/files/path')

const listUsers = async params => {
  const users = await userDB.list(params)
  return users
}

const createUser = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/users')
    body.photo = route
  }
  body.password = body.password ? generateHash(body.password) : undefined
  const user = await userDB.create(body)
  return user
}

const updateUser = async (userId, body, file, loggedUser) => {
  const user = await userDB.detail({ query: { _id: userId } })
  let dataUser = await saveImage(body, file)
  if (dataUser.password) {
    dataUser.password = generateHash(dataUser.password)
  }
  const updateUser = await userDB.update(userId, dataUser, false)
  timelineProgress(updateUser, user, loggedUser)
  return updateUser
}

const detailUser = async params => {
  const user = await userDB.detail(params)
  return user
}

const deleteUser = async (userId, loggedUser) => {
  const user = await userDB.remove(userId)
  return user
}

const createOrUpdateUser = async body => {
  let user
  try {
    const params = createFindQuery(body, '', { path: 'assessor.ref' })
    const lead = await userDB.detail(params)
    user = await editLead(lead.toJSON(), body)
  } catch (error) {
    if (error.status === 404) {
      user = createLead(body)
    } else {
      throw error
    }
  }
  return user
}

const countDocuments = async params => {
  const count = await userDB.count(params)
  return count
}

/* functions */
const createLead = async body => {
  const dataLead = await addInitialStatus(body)
  dataLead.assessor = await assignedAssessor(dataLead)
  const lead = await userDB.create(dataLead)
  sendSocket(lead)
  createTimeline({ linked: lead, type: 'Cuenta', name: 'Persona creada' })
  addCall(lead, body.courses)
  prepareCourses(lead.toJSON(), [], body.courses)
  incProspects(lead)
  return lead
}

const editLead = async (lead, body) => {
  const dataLead = await addInitialStatus({
    ...lead,
    ...body
  })
  if (!dataLead.assessor) {
    dataLead.assessor = await assignedAssessor(dataLead)
    incProspects(dataLead)
  } else if (lead.type === 'User') {
    incProspects(dataLead)
  }
  dataLead.courses = prepareCourses(dataLead, lead.courses, body.courses)
  const updateLead = await userDB.update(lead._id, dataLead)
  sendSocket(updateLead)
  addCall(updateLead, body.courses)
  return updateLead
}

const assignedAssessor = async lead => {
  const coursesId = lead.courses.map(course => course._id)
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

const addCall = async (lead, courses) => {
  const coursesName = courses.map(course => course.name).join(', ')
  const dataCall = {
    name: `Llamada de contacto [${coursesName}]`,
    hour: moment()
      .add(2, 'minutes')
      .format('HH:mm'),
    date: moment(),
    assigned: lead.assessor,
    linked: {
      names: lead.personalInfo.names,
      ref: lead._id
    }
  }
  try {
    const call = await callDB.create(dataCall)
    emitCall(call)
  } catch (error) {
    console.log('error save call', dataCall, error)
  }
}

const addInitialStatus = async user => {
  try {
    const progress = await progressDB.detail({ query: { order: 1 } })
    user.statusProgress = {
      name: progress.name,
      ref: progress._id
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
  }
  user.type = 'Lead'
  user.statusActivity = 'todo'
  user.status = 'Interesado'

  return user
}

const incProspects = async lead => {
  try {
    await userDB.update(lead.assessor.ref, { $inc: { prospects: 1 } })
  } catch (error) {
    console.log('error inc prospects', lead.assessor, error)
  }
}

const prepareCourses = (lead, oldCourses, newCourses) => {
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
        name: `Preguntó por el curso ${course.name}`,
        extra: course
      })
      sendEmailCourse(lead, course)
    }, 2000)
  })
  return [...newCourses, ...courses]
}

const sendSocket = lead => {
  try {
    const io = getSocket()
    io.to(lead.assessor.ref).emit('lead', lead)
  } catch (error) {
    console.log('error sockets', lead, error)
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

const sendEmailCourse = async (lead, dataCourse) => {
  const linked = payloadToData(lead)
  const assigned = payloadToData(lead.assessor.ref)
  const course = courseFunc.payloadToData(dataCourse)
  const to = linked.email
  const from = 'cursos@eai.edu.pe'
  const template_id = 'd-fe5148580749466aa59f69e5eab99c9a'
  const preheader = `Información del curso ${course.name}`
  const content = `Se envio informacion del curso de la plantilla pre definida en sengrid.`
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
    sendMailTemplate({
      to,
      from,
      substitutions,
      template_id,
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
    curso: course.name,
    inicio: course.startCourse,
    precio: course.price,
    precio_oferta: course.priceOffert,
    horas: course.academicHours,
    brochure: MEDIA_PATH + course.brochure,
    celular: assigned.mobile
  }

  return substitutions
}

const saveImage = async (user, file) => {
  if (file) {
    const route = await saveFile(file, '/users')
    user.photo = route
  }
  return user
}

const timelineProgress = (dataUser, lead, assigned) => {
  if (dataUser.statusProgress && lead.statusProgress) {
    const oldRef = lead.statusProgress.ref.toString()
    const oldName = lead.statusProgress.name
    const newRef = dataUser.statusProgress.ref.toString()
    const newName = dataUser.statusProgress.name
    if (oldRef !== newRef) {
      createTimeline({
        linked: lead,
        assigned,
        type: 'Progreso',
        name: `${oldName} -> ${newName}`
      })
    }
  }
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser,
  createOrUpdateUser
}
