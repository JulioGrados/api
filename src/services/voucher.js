'use strict'

const { voucherDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listVouchers = async params => {
  const vouchers = await voucherDB.list(params)
  return vouchers
}

const createVoucher = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/vouchers')
      body[label] = route
    }
  }

  const voucher = await voucherDB.create(body)
  return voucher
}

const updateVoucher = async (voucherId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/vouchers')
      body[label] = route
    }
  }
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
