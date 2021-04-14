'use strict'

const service = require('../services/deal')

const listDeals = async (req, res) => {
  const deals = await service.listDeals(req.query)
  return res.status(200).json(deals)
}

const createDeal = async (req, res) => {
  try {
    const deal = await service.createDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 500).json(error)
  }
}

const updateDeal = async (req, res) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDeal(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const updateDealCreate = async (req, res) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealCreate(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const detailDeal = async (req, res) => {
  const dealId = req.params.id
  const params = req.query
  if (params.query) {
    if (dealId) {
      params.query._id = dealId
    }
  } else if (dealId) {
    params.query = {
      _id: dealId
    }
  }

  try {
    const deal = await service.detailDeal(params)
    return res.status(200).json(deal)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteDeal = async (req, res) => {
  const dealId = req.params.id
  try {
    const deal = await service.deleteDeal(dealId, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

const createOrUpdate = async (req, res) => {
  try {
    const deal = await service.createOrUpdate(req.body)
    return res.status(201).json(deal)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 500).json(error)
  }
}

const enrolDeal = async (req, res) => {
  try {
    console.log('req.body', req.body)
    const deal = await service.enrolStudents(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  countDocuments,
  listDeals,
  createDeal,
  updateDeal,
  updateDealCreate,
  detailDeal,
  deleteDeal,
  createOrUpdate,
  enrolDeal
}
