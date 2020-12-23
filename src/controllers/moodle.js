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

const createCertificates = async (req, res) => {
  try {
    const resp = await services.gradeNewCertificate(req.body)
    return res.json(resp)
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

const createModulesCourse = async (req, res) => {
  try {
    const resp = await services.modulesCourse(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

const migrateUsers = async (req, res) => {
  try {
    const resp = await services.usersMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

const migrateEvaluations = async (req, res) => {
  try {
    const resp = await services.evaluationMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

const migrateEnrols = async (req, res) => {
  try {
    const resp = await services.enrolMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}


const migrateCertificates = async (req, res) => {
  try {
    const resp = await services.certificateMoodle(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

const migrateGrades = async (req, res) => {
  const resp = await services.usersGrades(req.body)
  return res.json(resp)
}

const migrateTestimonies = async (req, res) => {
  try {
    const resp = await services.testimoniesCourse(req.body)
    return res.json(resp)
  } catch (error) {
    return res.json(error.status || 500).json(error)
  }
}

module.exports = {
  createUser,
  enrrollUser,
  migrateUsers,
  migrateGrades,
  migrateEvaluations,
  migrateCertificates,
  migrateEnrols,
  createCertificates,
  createModulesCourse,
  migrateTestimonies
}
