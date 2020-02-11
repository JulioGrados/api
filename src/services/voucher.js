'use strict'

const { voucherDB } = require('../db')

const listVouchers = async params => {
  const vouchers = await voucherDB.list(params)
  return vouchers
}

const createVoucher = async (body, loggedUser) => {
  const voucher = await voucherDB.create(body)
  return voucher
}

const updateVoucher = async (voucherId, body, loggedUser) => {
  const voucher = await voucherDB.update(voucherId, body)
  return voucher
}

const detailVoucher = async params => {
  const voucher = await voucherDB.detail(params)
  return voucher
}

const deleteVoucher = async (voucherId, loggedUser) => {
  const voucher = await voucherDB.remove(voucherId)
  return voucher
}

const countDocuments = async params => {
  const count = await voucherDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listVouchers,
  createVoucher,
  updateVoucher,
  detailVoucher,
  deleteVoucher
}
