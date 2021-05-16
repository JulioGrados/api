'use strict'

const service = require('../services/sale')

const listSales = async (req, res) => {
  const sales = await service.listSales(req.query)
  return res.status(200).json(sales)
}

const createSales = async (req, res, next) => {
  try {
    const body = req.body.data ? JSON.parse(req.body.data) : req.body
    const files = req.files
    const sale = await service.createSale(body, files, req.user)
    return res.status(201).json(sale)
  } catch (error) {
    next(error)
  }
}

const updateSaleOne = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  const saleId = req.params.id
  try {
    const sale = await service.updateSaleOne(saleId, req.body, files, req.user)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const updateSale = async (req, res, next) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  const saleId = req.params.id
  try {
    const sale = await service.updateSale(saleId, body, files, req.user)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const detailSale = async (req, res, next) => {
  const saleId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = saleId
  } else {
    params.query = {
      _id: saleId
    }
  }

  try {
    const sale = await service.detailSale(params)
    return res.status(200).json(sale)
  } catch (error) {
    next(error)
  }
}

const deleteSale = async (req, res, next) => {
  const saleId = req.params.id
  try {
    const sale = await service.deleteSale(saleId, req.sale)
    return res.status(201).json(sale)
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
  listSales,
  createSales,
  updateSale,
  updateSaleOne,
  detailSale,
  deleteSale
}
