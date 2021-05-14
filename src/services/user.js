'use strict'

const config = require('config')
const { userDB, courseDB, dealDB } = require('../db')
const { getSocket } = require('../lib/io')
const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')
const { createOrUpdateDeal, createDealUserOnly } = require('./deal')
const { createTimeline } = require('./timeline')
const { loginUser } = require('./auth')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const uniqid = require('uniqid')

const listUsers = async params => {
  console.log('--------------------------------------------------------')
  console.log('USERS')
  console.log('--------------------------------------------------------')
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
  try {
    const dataUser = await saveImage(body, file)
    if (dataUser.password) {
      dataUser.password = generateHash(dataUser.password)
    }
    const updateUser = await userDB.update(userId, dataUser)
    return updateUser
  } catch (error) {
    console.log('error', error)
    throw error
  }
}

const detailUser = async params => {
  const user = await userDB.detail(params)
  return user
}

const deleteUser = async (userId, loggedUser) => {
  const user = await userDB.remove(userId)
  return user
}

const searchCourse = async (courseId) => {
  try {
    const course = await courseDB.detail({
      query: {
        _id: courseId
      }
    })
    return course
  } catch (error) {
    throw error
  }
}

const validate = (body) => {
  const { mobile, dni, email } = body
  
  if (!dni) {
    delete body.dni
  } else {
    if (dni.length === 2 && (dni.charCodeAt(0) === 39 && dni.charCodeAt(1) === 39) || (dni.charCodeAt(0) === 34 && dni.charCodeAt(1) === 34)) {
      delete body.dni 
    }
  }

  if (!mobile) {
    delete body.mobile
  } 

  if (!email) {
    delete body.email
  }

  return body
}

const createOrUpdateUser = async body => {
  let user
  body = validate(body)
  try {
    const params = createFindQuery(body)
    // console.log('params', params)
    const lead = await userDB.detail(params)
    // console.log('lead', lead)
    if (body.source && body.source === 'Facebook') {
      let course = await searchCourse(body.courseId)
      if (course) {
        body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
      }
    }
    // console.log('body', body)
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    user = await userDB.update(lead._id, { ...body })
    // console.log('user', user)
    await createOrUpdateDeal(user.toJSON(), body, lead, true)
  } catch (error) {
    if (error.status === 404) {
      // console.log('nuevo lead', body)
      body.roles = ['Interesado']
      user = await userDB.create(body)
      // courses en body
      if (body.source && body.source === 'Facebook') {
        let course = await searchCourse(body.courseId)
        if (course) {
          body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
        }
        body.origin = 'facebook lead'
      } else {
        body.origin = 'sitio web'
      }
      // console.log('body  nuevo', body)
      createTimeline({
        linked: user,
        type: 'Cuenta',
        name: 'Persona creada'
      })
      await createOrUpdateDeal(user.toJSON(), body)
    } else {
      throw error
    }
  }
  return user
}

const createStudent = async body => {
  let user
  try {
    const params = createFindQuery(body)
    const lead = await userDB.detail(params)

    const deal = await dealDB.detail({
      query: {
        $or: [
          { client: lead },
          { students: { $elemMatch: { 'student.ref': lead } } }
        ]
      }})
    
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    
    if (deal) {
      const error = {
        status: 402,
        message: 'Ya existe este trato.'
      }
      throw error
    } else {
      return lead
    }
  } catch (error) {
    if (error.status === 404) {
      body.roles = ['Interesado']
      user = await userDB.create(body)
    } else {
      throw error
    }
  }
  return user
}

const createDealUser = async body => {
  let user
  try {
    const params = createFindQuery(body)
    // console.log('params', params)
    const lead = await userDB.detail(params)
    
    // console.log('body', body)
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    body.source = body.origin
    user = await userDB.update(lead._id, { ...body })
    console.log('user', user)
    // createTimeline({
    //   linked: user,
    //   type: 'Cuenta',
    //   name: `Persona actualizada: [Nombres]: ${lead.names} - [Email]: ${lead.email} - [Celular]: ${lead.mobile} - [País]: ${lead.country} - [Ciudad]: ${lead.city}`
    // })
    await createDealUserOnly(user.toJSON(), body, lead, true)
  } catch (error) {
    if (error.status === 404) {
      // console.log('nuevo lead', body)
      body.source = body.origin
      body.roles = ['Interesado']
      user = await userDB.create(body)
      
      createTimeline({
        linked: user,
        type: 'Cuenta',
        name: 'Persona creada'
      })
      await createDealUserOnly(user.toJSON(), body)
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

const recoverPassword = async ({ username, password, token }) => {
  const user = await userDB.detail({ query: { username } })
  if (username && token) {
    if (!user.tokenRecover) {
      const error = {
        status: 402,
        message: 'El token no es valido!'
      }
      throw error
    }
    if (user.tokenRecover === token) {
      const newPassword = generateHash(password)
      await userDB.update(user._id, { password: newPassword, token: undefined })
      const data = await loginUser(username, password)
      return data
    }
  } else {
    if (!user.email) {
      const error = {
        status: 402,
        message: 'No tienes un email asociado a la cuenta.'
      }
      throw error
    }

    const tokenRecover = uniqid()

    await userDB.update(user._id, { tokenRecover })
    console.log(config)
    const urlBase =
      config.teach.env === 'development'
        ? config.teach.localUrl
        : config.teach.productionUrl

    sendMailTemplate({
      to: user.email,
      from: 'soporte@eai.edu.pe',
      substitutions: {
        name: user.firstName,
        link: `${urlBase}/recuperar?token=${tokenRecover}&username=${username}`
      },
      templateId: 'd-b6cd2a8f16004803ab5d5e2f6c7f901e'
    })
  }
}

/* functions */
const emitLead = user => {
  try {
    const io = getSocket()
    io.emit('user', user)
  } catch (error) {
    console.log('error sockets', user, error)
  }
}

const saveImage = async (user, file) => {
  if (file) {
    const route = await saveFile(file, '/users')
    user.photo = route
  }
  return user
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser,
  createOrUpdateUser,
  createDealUser,
  emitLead,
  recoverPassword,
  createStudent
}
