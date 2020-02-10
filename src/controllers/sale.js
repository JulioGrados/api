'use strict'

const service = require('../services/sale')

const listSales = async (req, res) => {
  const sales = await service.listSales(req.query)
  return res.status(200).json(sales)
}

const createSales = async (req, res) => {
  try {
    const sale = await service.createSale(req.body, req.sale)
    return res.status(201).json(sale)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateSale = async (req, res) => {
  const saleId = req.params.id
  try {
    const sale = await service.updateSale(saleId, req.body, req.sale)
    return res.status(200).json(sale)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailSale = async (req, res) => {
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
    return res.status(error.status || 500).json(error)
  }
}

const deleteSale = async (req, res) => {
  const saleId = req.params.id
  try {
    const sale = await service.deleteSale(saleId, req.sale)
    return res.status(201).json(sale)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  listSales,
  createSales,
  updateSale,
  detailSale,
  deleteSale
}
