'use strict'

const { logDB } = require('../db')

const listLogs = async (params) => {
  const logs = await logDB.list(params)
  return logs
}

const createLog = async (body, loggedUser) => {
  const log = await logDB.create(body)
  return log
}

const updateLog = async (logId, body, loggedUser) => {
  const log = await logDB.update(logId, body)
  return log
}

const detailLog = async (params) => {
  const log = await logDB.detail(params)
  return log
}

const deleteLog = async (logId, loggedUser) => {
  const log = await logDB.remove(logId)
  return log
}

module.exports = {
  listLogs,
  createLog,
  updateLog,
  detailLog,
  deleteLog
}
