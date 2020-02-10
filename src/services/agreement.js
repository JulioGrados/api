'use strict'

const moment = require('moment-timezone')
const { agreementDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listAgreements = async params => {
  const sagrements = await agreementDB.list(params)
  return sagrements
}

const createAgreement = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/agreements')
    body.image = route
  }
  const agreement = await agreementDB.create(body)
  return agreement
}

const updateAgreement = async (agreementId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/agreements')
    body.image = route
  }
  const agreement = await agreementDB.update(agreementId, body)
  return agreement
}

const detailAgreement = async params => {
  const agreement = await agreementDB.detail(params)
  return agreement
}

const deleteAgreement = async (agreementId, loggedUser) => {
  const agreement = await agreementDB.remove(agreementId)
  return agreement
}

module.exports = {
  listAgreements,
  createAgreement,
  updateAgreement,
  detailAgreement,
  deleteAgreement
}
