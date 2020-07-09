'use strict'

const service = require('../services/progress')

const listProgresses = async (req, res) => {
  const progresses = await service.listProgresses(req.query)
  return res.status(200).json(progresses)
}

const createProgress = async (req, res) => {
  try {
    const progress = await service.createProgress(req.body, req.progress)
    return res.status(201).json(progress)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateProgress = async (req, res) => {
  const progressId = req.params.id
  try {
    const progress = await service.updateProgress(
      progressId,
      req.body,
      req.progress
    )
    return res.status(200).json(progress)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailProgress = async (req, res) => {
  const progressId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = progressId
  } else {
    params.query = {
      _id: progressId
    }
  }

  try {
    const progress = await service.detailProgress(params)
    return res.status(200).json(progress)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteProgress = async (req, res) => {
  const progressId = req.params.id
  try {
    const progress = await service.deleteProgress(progressId, req.progress)
    return res.status(201).json(progress)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listProgresses,
  createProgress,
  updateProgress,
  detailProgress,
  deleteProgress
}
