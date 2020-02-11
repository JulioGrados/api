'use strict'

const { userDB } = require('../db')
const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createQueryEmailMobile } = require('utils/functions/user')

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
  const params = createQueryEmailMobile(body)
  try {
    const existUser = await userDB.detail(params)
    body.status = 'Interesado'
    if (body.courses) {
      const courses = existUser.courses.filter(course => {
        const index = body.courses.findIndex(item => {
          return item.ref.toString() === course.ref.toString()
        })
        return index === -1
      })
      body.courses = [...courses, ...body.courses]
    }
    const user = await userDB.update(existUser._id, body)
    return user
  } catch (error) {
    if (error.status === 404) {
      const user = await userDB.create(body)
      return user
    } else {
      throw error
    }
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser,
  createOrUpdateUser
}
