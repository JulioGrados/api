'use strict'

const service = require('../services/user')
const countriesData = require('utils/functions/countries')

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
    select: 'names firstName lastName description photo country username'
  }
  const users = await service.listUsers(params)
  return res.status(200).json(users)
}

const searchCodeNumber = number => {
  let code = number.substring(0, 2)
  let country 
  do {
    country = countriesData.find(item => item.callingCode === code)
    if (!country) {
      code = number.substring(0, code.length + 1)
    }
    console.log('entro')
  } while (code.length < 5 && !country)

  return {code, country}
}

const createOrUpdateUser = async (req, res) => {
  const body = req.body
  try {
    if (body.source && body.source === 'Facebook') {
      const number = body.phone && body.phone.substring(1)
      const phone = searchCodeNumber(number)
      if (!phone.country) {
        body.mobile = number
      } else {
        body.mobileCode = phone.code
        body.mobile = number.replace(phone.code, '')
        body.country = phone.country && phone.country.name
      }
    } 
    // console.log('body', body)
    const user = await service.createOrUpdateUser(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const createStudent = async (req, res) => {
  const body = req.body
  try {
    const user = await service.createStudent(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const createDealUser = async (req, res) => {
  const body = req.body
  try {
    console.log('body', body)
    const user = await service.createDealUser(body)
    return res.status(201).json(user)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const recoverPassword = async (req, res) => {
  const body = req.body
  try {
    const user = await service.recoverPassword(body)
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
  createDealUser,
  updateUser,
  detailUser,
  deleteUser,
  listTeachers,
  createOrUpdateUser,
  recoverPassword,
  createStudent
}
