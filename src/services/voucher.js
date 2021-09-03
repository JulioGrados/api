'use strict'

const { voucherDB } = require('../db')
const { saveFile } = require('utils/files/save')
const { orderDB } = require('../../../db/lib')
const { getSocket } = require('../lib/io')

const listVouchers = async params => {
  const vouchers = await voucherDB.list(params)
  return vouchers
}

const createVoucher = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      if (label === 'image') {
        const route = await saveFile(files['image'], '/vouchers')
        body[label] = route
      } else {
        const route = await saveFile(files[label], '/vouchers')
        if (body['extras']) {
          body['extras'] = [ ...body['extras'], route]
        } else {
          body['extras'] = [route]
        }
        console.log('body', body['extras'])
      }
    }
  }
  const voucher = await voucherDB.create(body)
  return voucher
}

const updateVoucher = async (voucherId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      if (label === 'image') {
        const route = await saveFile(files['image'], '/vouchers')
        body[label] = route
      } else {
        const route = await saveFile(files[label], '/vouchers')
        if (body['extras']) {
          body['extras'] = [ ...body['extras'], route]
        } else {
          body['extras'] = [route]
        }
        console.log('body', body['extras'])
      }
    }
  }
  const voucher = await voucherDB.update(voucherId, body)
  return voucher
}

const updateAdminVoucher = async (voucherId, body, loggedUser) => {
  const { orders, voucher } = body
  
  try {
    await Promise.all(
      orders.map(async order => {
        const orderRes = await orderDB.update(order._id, {
          voucher: undefined,
          status: 'Por Pagar'
        })
        return orderRes
      })
    )
  } catch (error) {
    throw error
  }

  const updateVoucher = await voucherDB.update(voucherId, {
    residue: voucher.amount,
    isUsed: false
  })
  return updateVoucher
}

const detailVoucher = async params => {
  const voucher = await voucherDB.detail(params)
  return voucher
}

const detailAdminVoucher = async (params, voucherId) => {
  const voucher = await voucherDB.detail(params)
  const orders = await orderDB.list({ query: { 'voucher.ref': voucherId } })
  const reset = orders.some(order => order.status !== 'Cancelada' && order.status !== 'Usada')
  console.log('reset', reset)
  return {
    ...voucher.toJSON(),
    orders: orders ? orders : [],
    reset: reset ? reset : false
  }
}

const deleteVoucher = async (voucherId, loggedUser) => {
  const voucher = await voucherDB.remove(voucherId)
  return voucher
}

const countDocuments = async params => {
  const count = await voucherDB.count(params)
  return count
}

const emitVoucher = (voucher, user) => {
  try {
    if (user && user._id) {
      const io = getSocket()
      io.to(user._id).emit('voucher', voucher)
    }
  } catch (error) {
    console.log('error sockets', voucher, error)
  }
}

module.exports = {
  countDocuments,
  listVouchers,
  createVoucher,
  updateVoucher,
  updateAdminVoucher,
  detailVoucher,
  detailAdminVoucher,
  emitVoucher,
  deleteVoucher
}
