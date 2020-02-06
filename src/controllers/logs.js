'use strict'

const serviceLog = require('../services/log')

const listLogs = async (req, res) => {
  const logs = await serviceLog.listLogs(req.query)
  return res.status(200).json(logs)
}

const createLog = async (req, res) => {
  try {
    const log = await serviceLog.createLog(req.body, req.user)
    return res.status(201).json(log)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateLog = async (req, res) => {
  const logId = req.params.id
  try {
    const log = await serviceLog.updateLog(logId, req.body, req.user)
    return res.status(200).json(log)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailLog = async (req, res) => {
  const logId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = logId
  } else {
    params.query = {
      _id: logId
    }
  }

  try {
    const log = await serviceLog.detailLog(params)
    return res.status(200).json(log)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteLog = async (req, res) => {
  const logId = req.params.id
  try {
    const log = await serviceLog.deleteLog(logId, req.user)
    return res.status(201).json(log)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listLogs,
  createLog,
  updateLog,
  detailLog,
  deleteLog
}
