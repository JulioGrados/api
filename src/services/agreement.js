'use strict'

const {agreementDB} = require('../db')

const listAgreement = async (params) => {
  const sagrements = await agreementDB.list(params)
  return sagrements
}

const createAgreement = async (body, loggedUser) => {
  const agreement = await agreementDB.create(body)
  return agreement
}

const updateAgrement = async (agreementId, body, loggedUser) => {
  console.log("services")
  const agreement = await agreementDB.update(agreementId, body)
  return agreement
}

const detailAgreement = async (params) => {
  const agreement = await agreementDB.detail(params)
  return agreement
}

const deleteAgreement = async (agreementId, loggedUser) => {
  const agreement = await agreementDB.remove(agreementId)
  return agreement
}

module.exports = {
  listAgreement,
  createAgreement,
  updateAgrement,
  detailAgreement,
  deleteAgreement
}