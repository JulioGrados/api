'use strict'

const { receiptDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listReceipts = async params => {
  const receipts = await receiptDB.list(params)
  return receipts
}

const createReceipt = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const receipt = await receiptDB.create(body)
  return receipt
}

const updateReceipt = async (receiptId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const receipt = await receiptDB.update(receiptId, body)
  return receipt
}

const detailReceipt = async params => {
  const receipt = await receiptDB.detail(params)
  return receipt
}

const deleteReceipt = async (receiptId, loggedUser) => {
  const receipt = await receiptDB.remove(receiptId)
  return receipt
}

const countDocuments = async params => {
  const count = await receiptDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listReceipts,
  createReceipt,
  updateReceipt,
  detailReceipt,
  deleteReceipt
}
