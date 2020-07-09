const service = require('../services/migration')
const { csv2json } = require('utils/functions/csv')

const migrateTeachers = async (req, res) => {
  const data = JSON.parse(req.files.data.data.toString())
  try {
    const teachers = await service.migrateTeachers(data)
    return res.status(200).json(teachers)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateCourses = async (req, res) => {
  req.setTimeout(0)
  const dataCourses = JSON.parse(req.files.courses.data.toString())
  const dataTeachers = JSON.parse(req.files.teachers.data.toString())
  const dataAgreements = JSON.parse(req.files.agreements.data.toString())
  const dataBrochure = await csv2json(req.files.csv.data)
  try {
    const response = await service.migrateCourses(
      dataCourses,
      dataTeachers,
      dataBrochure,
      dataAgreements
    )
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateMoodleCourses = async (req, res) => {
  try {
    const response = await service.migrateMoodleCourses()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateMoodleUsers = async (req, res) => {
  try {
    const response = await service.migrateUsersMoodle()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateMoodleEnroll = async (req, res) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateEnrollMoodle()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateMoodleEvaluations = async (req, res) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateEvaluationsMoodle()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateQuizMoodle = async (req, res) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateQuizMoodle()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}
const migrateTaskMoodle = async (req, res) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateTaskMoodle()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}
const migrateCertificates = async (req, res) => {
  req.setTimeout(0)
  try {
    const response = await service.migrateCertificates()
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  migrateTeachers,
  migrateCourses,
  migrateMoodleCourses,
  migrateMoodleUsers,
  migrateMoodleEnroll,
  migrateMoodleEvaluations,
  migrateQuizMoodle,
  migrateTaskMoodle,
  migrateCertificates
}
