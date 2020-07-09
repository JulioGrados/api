'use strict'

const services = require('../services/moodle')

const createUser = async (req, res) => {
  try {
    const user = await services.createNewUser(req.body)
    return user
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

const enrrollUser = async (req, res) => {
  try {
    const enroll = await services.createEnrolUser(req.body)
    return enroll
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

module.exports = {
  createUser,
  enrrollUser
}
