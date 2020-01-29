'use strict'

const serviceProgress = require('../services/progress')

const listProgresss = async (req, res) => {
  const progresss = await serviceProgress.listProgresss(req.query)
  return res.status(200).json(progresss)
}

const createProgress = async (req, res) => {
  try {
    const progress = await serviceProgress.createProgress(req.body, req.progress)
    return res.status(201).json(progress)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateProgress = async (req, res) => {
  const progressId = req.params.id
  try {
    const progress = await serviceProgress.updateProgress(progressId, req.body, req.progress)
    return res.status(200).json(progress)
  } catch (error) {
    return res.status(error.status).json(error)
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
    const progress = await serviceProgress.detailProgress(params)
    return res.status(200).json(progress)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteProgress = async (req, res) => {
  const progressId = req.params.id
  try {
    await serviceProgress.deleteProgress(progressId, req.progress)
    return res.status(201).json()
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listProgresss,
  createProgress,
  updateProgress,
  detailProgress,
  deleteProgress
}
