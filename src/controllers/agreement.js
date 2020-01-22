'use strict'

const serviceAgreement = require('../services/agreement')

const listAgreements = async (req, res) => {
  const agreements = await serviceAgreement.listAgreements(req.query)
  return res.status(200).json(agreements)
}

const createAgreement = async (req, res) => {
  try {
    const agreement = await serviceAgreement.createAgreement(req.body, req.agreement)
    return res.status(201).json(agreement)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateAgreement = async (req, res) => {
  const agreementId = req.params.id
  try {
    const agreement = await serviceAgreement.updateAgreement(agreementId, req.body, req.agreement)
    return res.status(200).json(agreement)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailAgreement = async (req, res) => {
  const agreementId = req.params.id
  const params = req.query
  if(params.query) {
    params.query._id = agreementId
  } else {
    params.query = {
      _id: agreementId
    }
  }

  try {
    const agreement = await serviceAgreement.detailAgreement(params)
    return res.status(200).json(agreement)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteAgreement = async (req, res) => {
  const agreementId = req.params.id
  try {
    await serviceAgreement.deleteAgreement(agreementId, req.agreement)
    return res.status(204).json()
  }catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listAgreements,
  createAgreement,
  updateAgreement,
  detailAgreement,
  deleteAgreement
}