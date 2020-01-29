'use strict'

const serviceSale = require('../services/sale')

const listSales = async (req, res) => {
  const sales = await serviceSale.listSales(req.query)
  return res.status(200).json(sales)
}

const createSales = async (req, res) => {
  try {
    const sale = await serviceSale.createSales(req.body, req.sale)
    return res.status(201).json(sale)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateSale = async (req, res) => {
  const saleId = req.params.id
  try {
    const sale = await serviceSale.updateSale(saleId, req.body, req.sale)
    return res.status(200).json(sale)
  } catch (error) {
    return res.status(error.status).json(error)
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
    const sale = await serviceSale.detailSale(params)
    return res.status(200).json(sale)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteSale = async (req, res) => {
  const saleId = req.params.id
  try {
    await serviceSale.deleteSale(saleId, req.sale)
    return res.status(201).json()
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listSales,
  createSales,
  updateSale,
  detailSale,
  deleteSale
}
