'use strict'

const config = require('config')
const CustomError = require('custom-error-instance')
const { userDB, courseDB, dealDB, timetableDB } = require('../db')
const { getSocket } = require('../lib/io')
const { generateHash } = require('utils').auth
const { api } = require('utils/functions/zadarma')
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')
const { deleteUsersMoodle } = require('utils/functions/moodle')
const { createOrUpdateDeal, createDealUserOnly, addOrUpdateUserDeal } = require('./deal')
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

const updateUserStage = async (userId, body, loggedUser) => {
  const user = await userDB.update(userId, body)
  if (user.stage) {
    await timetableDB.create({
      linked: {
        username: user.username,
        ref: user._id
      },
      type: 'Trabajo',
      stage: 'Inicio'
    })
  } else {
    await timetableDB.create({
      linked: {
        username: user.username,
        ref: user._id
      },
      type: 'Fuera',
      stage: 'Fin'
    })
  }
  return user
}

const updateDniUser = async (userId, body, loggedUser) => {
  delete body.dni
  const user = await userDB.updateDni(userId, body)
  return user
}

const updateAccountUser = async (userId, body, loggedUser) => {
  delete body.username
  delete body.password
  const user = await userDB.updateAccount(userId, body)
  return user
}

const updateAccountUserMoodle = async (userId, body, loggedUser) => {
  delete body.username
  delete body.password
  
  const userDelete = await deleteUsersMoodle(body.moodleId)
  console.log('userDelete', userDelete)
  
  delete body.moodleId
  const user = await userDB.updateAccountMoodle(userId, body)
  return user
}

const updatePhotoUser = async (userId, body, loggedUser) => {
  delete body.dni
  const user = await userDB.updatePhoto(userId, body)
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
  } else {
    if (mobile.length === 2 && (mobile.charCodeAt(0) === 39 && mobile.charCodeAt(1) === 39) || (mobile.charCodeAt(0) === 34 && mobile.charCodeAt(1) === 34)) {
      delete body.mobile 
    }
  }

  if (!email) {
    delete body.email
  } else {
    if (email.length === 2 && (email.charCodeAt(0) === 39 && email.charCodeAt(1) === 39) || (email.charCodeAt(0) === 34 && email.charCodeAt(1) === 34)) {
      delete body.email 
    }
  }

  return body
}

const createOrUpdateUser = async body => {
  let user
  body = validate(body)
  try {
    const params = createFindQuery(body)
    // console.log('params', params.query)
    const lead = await userDB.detail(params)
    // console.log('lead', lead)
    if (body.source && body.source === 'Facebook') {
      let course = await searchCourse(body.courseId)
      if (course) {
        body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
      }
    }
    
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    
    if (lead.dni === body.dni) {
      delete body.dni
    }
    // console.log('body', body)
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

const addOrUpdateUser = async body => {
  let user
  body = validate(body)
  try {
    const params = createFindQuery(body)
    // console.log('params', params.query)
    const lead = await userDB.detail(params)
    // console.log('lead', lead)
    if (body.source && body.source === 'Facebook') {
      let course = await searchCourse(body.courseId)
      if (course) {
        body.courses = [{ ...course.toJSON(), ref: course.toJSON() }]
      }
    }
    
    if (lead.roles && lead.roles.length) {
      if (lead.roles.findIndex(role => role === 'Interesado') === -1) {
        body.roles = ['Interesado', ...lead.roles]
      }
    } else {
      body.roles = ['Interesado']
    }
    
    if (lead.dni === body.dni) {
      delete body.dni
    }
    // console.log('body', body)
    user = await userDB.update(lead._id, { ...body })
    // console.log('user', user)
    await addOrUpdateUserDeal(user.toJSON(), body, lead, true)
    return user
  } catch (error) {
    console.log('error', error)
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
      await addOrUpdateUserDeal(user.toJSON(), body)
      return user
    } else {
      throw error
    }
  }
}

const createStudent = async body => {
  let user
  try {
    console.log('body', body)
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
      const InvalidError = CustomError('InvalidError', { message: 'Ya existe este trato.', code: 'EINVLD', deal: {...deal.toJSON()} }, CustomError.factory.expectReceive);
      throw new InvalidError()
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

const saveTokenZadarma = async () => {
  const usersAssessor = await userDB.list({ query: { roles: 'Asesor', isZadarma: true } })
  const usersUpdate = usersAssessor.map(async user => {
    if (user.zadarma && user.zadarma.annexed) {
      try {
        const balance = await api({
          api_method: '/v1/webrtc/get_key/',
          params: {
              sip: user.zadarma.annexed
          }
        })

        const updateUser = await userDB.update(user._id.toString(), {
          zadarma: {
            annexed: user.zadarma.annexed,
            token: balance.data.key
          }
        })
        console.log('updateUser', updateUser)
        return updateUser
      } catch (error) {
        throw error
      }
    } else {
      const InvalidError = CustomError('InvalidError', { message: 'El usuario no tiene anexo zadarma.', code: 'EINVLD', deal: {...deal.toJSON()} }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  })
  const results = await Promise.all(usersUpdate.map(p => p.catch(e => e)))
  const validUsers = results.filter(result => !result.error)
  const errorUsers = results.filter(result => result.error)

  return { validUsers, errorUsers }
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  updateUser,
  updateUserStage,
  updateDniUser,
  updateAccountUser,
  updateAccountUserMoodle,
  updatePhotoUser,
  detailUser,
  deleteUser,
  createOrUpdateUser,
  addOrUpdateUser,
  createDealUser,
  emitLead,
  recoverPassword,
  createStudent,
  saveTokenZadarma
}
