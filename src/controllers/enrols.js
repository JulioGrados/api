'use strict'

const service = require('../services/enrol')

const listEnrols = async (req, res) => {
  const enrols = await service.listEnrols(req.query)
  return res.status(200).json(enrols)
}

const sendEnrolEmail = async (req, res, next) => {
  try {
    const enrol = await service.createEmailEnrol(req.body)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const createEnrol = async (req, res, next) => {
  try {
    const enrol = await service.createEnrol(req.body, req.user)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const updateEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  try {
    const enrol = await service.updateEnrol(enrolId, req.body, req.user)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const updateMoodleEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  
  try {
    const enrol = await service.updateMoodle(enrolId, req.body, req.user)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const detailEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = enrolId
  } else {
    params.query = {
      _id: enrolId
    }
  }

  try {
    const enrol = await service.detailEnrol(params)
    return res.status(200).json(enrol)
  } catch (error) {
    next(error)
  }
}

const deleteEnrol = async (req, res, next) => {
  const enrolId = req.params.id
  try {
    const enrol = await service.deleteEnrol(enrolId, req.user)
    return res.status(201).json(enrol)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listEnrols,
  createEnrol,
  updateEnrol,
  updateMoodleEnrol,
  detailEnrol,
  deleteEnrol,
  sendEnrolEmail
}
