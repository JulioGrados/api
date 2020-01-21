'use strict'

const serviceUser = require('../services/user')

const listUsers = async (req, res) => {
  const users = await serviceUser.listUsers(req.query)
  return res.status(200).json(users)
}

const createUser = async (req, res) => {
  try {
    const user = await serviceUser.createUser(req.body, req.user)
    return res.status(201).json(user)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateUser = async (req, res) => {
  const userId = req.params.id
  try {
    const user = await serviceUser.updateUser(userId, req.body, req.user)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailUser = async (req, res) => {
  const userId = req.params.id
  const params = req.query
  if(params.query) {
    params.query._id = userId
  } else {
    params.query = {
      _id: userId
    }
  }

  try {
    const user = await serviceUser.detailUser(params)
    return user
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteUser = async (req, res) => {
  const userId = req.params.id
  try {
    await serviceUser.deleteUser(userId, req.user)
    return res.status(204).json()
  }catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser
}