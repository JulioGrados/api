'use strict'

const { saleDB } = require('../db')

const listSales = async params => {
  const sales = await saleDB.list(params)
  return sales
}

const createSale = async (body, loggedUser) => {
  const sale = await saleDB.create(body)
  return sale
}

const updateSale = async (saleId, body, loggedUser) => {
  const sale = await saleDB.update(saleId, body)
  return sale
}

const detailSale = async params => {
  const sale = await saleDB.detail(params)
  return sale
}

const deleteSale = async (saleId, loggedUser) => {
  const sale = await saleDB.remove(saleId)
  return sale
}

const countDocuments = async params => {
  const count = await saleDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listSales,
  createSale,
  updateSale,
  detailSale,
  deleteSale
}
