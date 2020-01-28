'use strict'

const { userDB } = require('../db')
const { generateHash } = require('utils').auth

const listUsers = async (params) => {
  const users = await userDB.list(params)
  return users
}

const createUser = async (body, loggedUser) => {
  body.password = body.password ? generateHash(body.password) : undefined 
  const user = await userDB.create(body)
  return user
}

const updateUser = async (userId, body, loggedUser) => {
  if (body.password) {
    body.password = generateHash(body.password)
  }
  const user = await userDB.update(userId, body)
  return user
}

const detailUser = async (params) => {
  const user = await userDB.detail(params)
  return user
}

const deleteUser = async (userId, loggedUser) => {
  const user = await userDB.remove(userId)
  return user
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser
}
