'use strict'

const service = require('../services/voucher')

const listVouchers = async (req, res) => {
  const vouchers = await service.listVouchers(req.query)
  return res.status(200).json(vouchers)
}

const createVoucher = async (req, res) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  try {
    const voucher = await service.createVoucher(body, files, req.user)
    return res.status(201).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateVoucher = async (req, res) => {
  const voucherId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  try {
    const voucher = await service.updateVoucher(
      voucherId,
      body,
      files,
      req.user
    )
    return res.status(200).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailVoucher = async (req, res) => {
  const voucherId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = voucherId
  } else {
    params.query = {
      _id: voucherId
    }
  }

  try {
    const voucher = await service.detailVoucher(params)
    return res.status(200).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteVoucher = async (req, res) => {
  const voucherId = req.params.id
  try {
    const voucher = await service.deleteVoucher(voucherId, req.user)
    return res.status(201).json(voucher)
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
  listVouchers,
  createVoucher,
  updateVoucher,
  detailVoucher,
  deleteVoucher
}
