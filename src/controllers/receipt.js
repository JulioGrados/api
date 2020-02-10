'use strict'

const serviceReceipt = require('../services/receipt')

const listReceipts = async (req, res) => {
  const receipts = await serviceReceipt.listReceipts(req.query)
  return res.status(200).json(receipts)
}

const createReceipt = async (req, res) => {
  try {
    const whatsapp = await serviceReceipt.createReceipt(req.body, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateReceipt = async (req, res) => {
  const receiptId = req.params.id
  try {
    const whatsapp = await serviceReceipt.updateReceipt(
      receiptId,
      req.body,
      req.whatsapp
    )
    return res.status(200).json(whatsapp)
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
    const whatsapp = await serviceReceipt.detailReceipt(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteReceipt = async (req, res) => {
  const receiptId = req.params.id
  try {
    const receipt = await serviceReceipt.deleteReceipt(receiptId, req.whatsapp)
    return res.status(201).json(receipt)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  listReceipts,
  createReceipt,
  updateReceipt,
  detailReceipt,
  deleteReceipt
}
