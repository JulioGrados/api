'use strict'

const config = require('config')
const { userDB } = require('../db')
const { getSocket } = require('../lib/io')
const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')
const { createOrUpdateDeal } = require('./deal')
const { createTimeline } = require('./timeline')
const { loginUser } = require('./auth')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const uniqid = require('uniqid')

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

const createOrUpdateUser = async body => {
  let user
  try {
    const params = createFindQuery(body)
    const lead = await userDB.detail(params)
    user = await userDB.update(lead._id, { ...body })
    await createOrUpdateDeal(user.toJSON(), body)
  } catch (error) {
    if (error.status === 404) {
      user = await userDB.create(body)
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
  emitLead,
  recoverPassword
}
