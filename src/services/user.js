'use strict'

const { userDB, progressDB } = require('../db')
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
  const progress = await progressDB.detail({ query: { order: 1 } })
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
    body.statusProgress = {
      name: progress.name,
      ref: progress._id
    }
    console.log('body', body)
    const user = await userDB.update(existUser._id, body)
    console.log('user', user)
    return user
  } catch (error) {
    if (error.status === 404) {
      body.statusProgress = {
        name: progress.name,
        ref: progress._id
      }
      const user = await userDB.create(body)
      return user
    } else {
      throw error
    }
  }
}

const countDocuments = async params => {
  const count = await userDB.count(params)
  return count
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
