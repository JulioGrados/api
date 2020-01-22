'use strict'

const { receiptDB } = require('../db')

const listReceipts = async (params) => {
  const receipts = await receiptDB.list(params)
  return receipts
}

const createReceipt = async (body, loggedUser) => {
  const receipt = await receiptDB.create(body)
  return receipt
}

const updateReceipt = async (receiptId, body, loggedUser) => {
  console.log('services')
  const receipt = await receiptDB.update(receiptId, body)
  return receipt
}

const detailReceipt = async (params) => {
  const receipt = await receiptDB.detail(params)
  return receipt
}

const deleteReceipt = async (receiptId, loggedUser) => {
  const receipt = await receiptDB.remove(receiptId)
  return receipt
}

module.exports = {
  listReceipts,
  createReceipt,
  updateReceipt,
  detailReceipt,
  deleteReceipt
}
