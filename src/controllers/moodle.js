'use strict'

const services = require('../services/moodle')
const servicesSql = require('../services/sql')

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

const getEnroolments = async (req, res) => {
  try {
    console.log('lamooooooooooooooo')
    const enrolls = await servicesSql.getAllEnrollments()
    console.log('devolviooooooooooooo')
    return res.json(enrolls)
  } catch (error) {
    console.log('eroooooooooor', error)
    return res.json(error.status || 500).json(error)
  }
}

module.exports = {
  createUser,
  enrrollUser,
  getEnroolments
}
