'use strict'

const service = require('../services/charge')

const listCharges = async (req, res) => {
  const charges = await service.listCharges(req.query)
  return res.status(200).json(charges)
}

const createCharge = async (req, res, next) => {
  try {
    const charge = await service.createCharge(req.body, req.charge)
    return res.status(201).json(charge)
  } catch (error) {
    next(error)
  }
}

const updateCharge = async (req, res, next) => {
  const chargeId = req.params.id

  try {
    const charge = await service.updateCharge(chargeId, req.body, req.user)
    return res.status(200).json(charge)
  } catch (error) {
    next(error)
  }
}

const detailCharge = async (req, res, next) => {
  const chargeId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = chargeId
  } else {
    params.query = {
      _id: chargeId
    }
  }

  try {
    const charge = await service.detailCharge(params)
    return res.status(200).json(charge)
  } catch (error) {
    next(error)
  }
}

const deleteCharge = async (req, res, next) => {
  const chargeId = req.params.id
  try {
    const charge = await service.deleteCharge(chargeId, req.charge)
    return res.status(201).json(charge)
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
  listCharges,
  createCharge,
  updateCharge,
  detailCharge,
  deleteCharge
}