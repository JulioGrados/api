'use strict'

const serviceVoucher = require('../services/voucher')

const listVouchers = async (req, res) => {
  const vouchers = await serviceVoucher.listVouchers(req.query)
  return res.status(200).json(vouchers)
}

const createVoucher = async (req, res) => {
  try {
    const voucher = await serviceVoucher.createVoucher(req.body, req.user)
    return res.status(201).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateVoucher = async (req, res) => {
  const voucherId = req.params.id
  try {
    const voucher = await serviceVoucher.updateVoucher(
      voucherId,
      req.body,
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
    const voucher = await serviceVoucher.detailVoucher(params)
    return res.status(200).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteVoucher = async (req, res) => {
  const voucherId = req.params.id
  try {
    const voucher = await serviceVoucher.deleteVoucher(voucherId, req.user)
    return res.status(201).json(voucher)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  listVouchers,
  createVoucher,
  updateVoucher,
  detailVoucher,
  deleteVoucher
}
