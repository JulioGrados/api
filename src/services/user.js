'use strict'

const _ = require('lodash')
const moment = require('moment-timezone')

const { getSocket } = require('../lib/io')

const { userDB, progressDB, callDB } = require('../db')

const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')

const { createTimeline } = require('./timeline')

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
  if (file) {
    const route = await saveFile(file, '/users')
    body.photo = route
  }
  if (body.password) {
    body.password = generateHash(body.password)
  }
  const user = await userDB.update(userId, body)
  return user
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
    const params = createFindQuery(body)
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
  addCall(lead, body.courses)
  prepareCourses(lead, [], body.courses)
  incProspects(lead)
  createTimeline({ lead, type: 'Cuenta', subtype: 'Creación' })
  sendSocket('lead', lead)
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
    incProspects(lead)
  }
  dataLead.courses = prepareCourses(lead, lead.courses, body.courses)
  const updateLead = await userDB.update(lead._id, dataLead)
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
    },
    select: { username: 1, prospects: 1 }
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
      ref: min._id
    }

    return assessor
  } else {
    return null
  }
}

const addCall = async (lead, courses) => {
  const coursesName = courses.map(course => course.name).join(', ')
  const dataCall = {
    name: `Llamada de contacto (${coursesName})`,
    hour: moment().format('HH:mm'),
    date: moment(),
    assigned: lead.assessor,
    linked: {
      names: lead.personalInfo.names,
      ref: lead._id
    }
  }
  try {
    await callDB.create(dataCall)
    createTimeline({ lead, type: 'Llamada', subtype: 'Agenda' })
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
    createTimeline({ lead, type: 'Curso', subtype: 'Preguntó', extra: course })
  })
  return [...newCourses, ...courses]
}

const sendSocket = (type, lead) => {
  try {
    const io = getSocket()
    io.to(lead.assessor.ref).emit(type, lead)
  } catch (error) {
    console.log('error sockets', type, error)
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
