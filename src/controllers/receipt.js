'use strict'

const service = require('../services/receipt')

const listReceipts = async (req, res) => {
  const receipts = await service.listReceipts(req.query)
  return res.status(200).json(receipts)
}

const createReceipt = async (req, res) => {
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const receipt = await service.createReceipt(body, files, req.user)
    return res.status(201).json(receipt)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateReceipt = async (req, res) => {
  const receiptId = req.params.id
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const receipt = await service.updateReceipt(
      receiptId,
      body,
      files,
      req.receipt
    )
    return res.status(200).json(receipt)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailReceipt = async (req, res) => {
  const receiptId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = receiptId
  } else {
    params.query = {
      _id: receiptId
    }
  }

  try {
    const receipt = await service.detailReceipt(params)
    return res.status(200).json(receipt)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteReceipt = async (req, res) => {
  const receiptId = req.params.id
  try {
    const receipt = await service.deleteReceipt(receiptId, req.receipt)
    return res.status(201).json(receipt)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listReceipts,
  createReceipt,
  updateReceipt,
  detailReceipt,
  deleteReceipt
}
