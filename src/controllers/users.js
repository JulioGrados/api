'use strict'

const service = require('../services/user')

const listUsers = async (req, res) => {
  const users = await service.listUsers(req.query)
  return res.status(200).json(users)
}

const createUser = async (req, res) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.photo
  try {
    const user = await service.createUser(body, file, req.user)
    return res.status(201).json(user)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateUser = async (req, res) => {
  const userId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const file = req.files && req.files.photo
  try {
    const user = await service.updateUser(userId, body, file, req.user)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailUser = async (req, res) => {
  const userId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = userId
  } else {
    params.query = {
      _id: userId
    }
  }

  try {
    const user = await service.detailUser(params)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteUser = async (req, res) => {
  const userId = req.params.id
  try {
    const user = await service.deleteUser(userId, req.user)
    return res.status(201).json(user)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

// Open Controllers
const listTeachers = async (req, res) => {
  const params = {
    ...req.query,
    select: 'personalInfo firstName lastName description photo country username'
  }
  const users = await service.listUsers(params)
  return res.status(200).json(users)
}

const createOrUpdateUser = async (req, res) => {
  const body = req.body
  try {
    const user = await service.createOrUpdateUser(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser,
  listTeachers,
  createOrUpdateUser
}
