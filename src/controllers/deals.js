'use strict'

const service = require('../services/deal')

const listDeals = async (req, res) => {
  const deals = await service.listDeals(req.query)
  return res.status(200).json(deals)
}

const generalDeals = async (req, res, next) => {
  try {
    const deals = await service.generalDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const assessorDeals = async (req, res, next) => {
  try {
    const deals = await service.assessorDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const searchDeals = async (req, res, next) => {
  try {
    const deals = await service.searchDeals(req.query)
    return res.status(200).json(deals)
  } catch (error) {
    next(error)
  }
}

const createDeal = async (req, res, next) => {
  try {
    const deal = await service.createDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const mixDeal = async (req, res, next) => {
  try {
    const deal = await service.mixDeal(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDeal = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDeal(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDealOne = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealOne(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateDealCreate = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateDealCreate(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const updateWinner = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.updateWinner(dealId, req.body, req.user)
    return res.status(200).json(deal)
  } catch (error) {
    next(error)
  }
}

const detailDeal = async (req, res, next) => {
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
    next(error)
  }
}

const deleteDeal = async (req, res, next) => {
  const dealId = req.params.id
  try {
    const deal = await service.deleteDeal(dealId, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

const createOrUpdate = async (req, res, next) => {
  try {
    const deal = await service.createOrUpdate(req.body)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

const enrolDeal = async (req, res, next) => {
  try {
    const deal = await service.enrolStudents(req.body, req.user)
    return res.status(201).json(deal)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  countDocuments,
  listDeals,
  generalDeals,
  assessorDeals,
  searchDeals,
  createDeal,
  mixDeal,
  updateDeal,
  updateDealOne,
  updateDealCreate,
  updateWinner,
  detailDeal,
  deleteDeal,
  createOrUpdate,
  enrolDeal
}
