'use strict'

const { enrolDB } = require('../db')

const listEnrols = async params => {
  const enrols = await enrolDB.list(params)
  return enrols
}

const createEnrol = async (body, loggedUser) => {
  const enrol = await enrolDB.create(body)
  return enrol
}

const updateEnrol = async (enrolId, body, loggedUser) => {
  const enrol = await enrolDB.update(enrolId, body)
  return enrol
}

const detailEnrol = async params => {
  const enrol = await enrolDB.detail(params)
  return enrol
}

const deleteEnrol = async (enrolId, loggedEnrol) => {
  const enrol = await enrolDB.remove(enrolId)
  return enrol
}

const countDocuments = async params => {
  const count = await enrolDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listEnrols,
  createEnrol,
  updateEnrol,
  detailEnrol,
  deleteEnrol
}
