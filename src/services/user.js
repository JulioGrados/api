'use strict'

const { userDB } = require('../db')
const { getSocket } = require('../lib/io')
const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')
const { createOrUpdateDeal } = require('./deal')
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
  emitLead
}
