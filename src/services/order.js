'use strict'

const CustomError = require('custom-error-instance')
const { orderDB, voucherDB } = require('../db')
const { emitVoucher } = require('./voucher')

const listOrders = async params => {
  console.log('--------------------------------------------------------')
  console.log('ORDERS')
  console.log('--------------------------------------------------------')
  const orders = await orderDB.list(params)
  return orders
}

const assessorOrders = async params => {
  console.log('--------------------------------------------------------')
  console.log('ORDERS ASSESSOR')
  console.log('--------------------------------------------------------')
  const orders = await orderDB.assessor(params)
  return orders
}

const findVoucher = async (voucher) => {
  try {
    const dbVoucher = await voucherDB.detail({ query: { code: voucher.code } })
    
    return dbVoucher
  } catch (error) {
    throw error
  }
}

const getResidueVoucher = (voucherAmount, orderAmount) => {
  const residue = parseFloat(voucherAmount) - parseFloat(orderAmount)
  let isUsed = false
  if (residue < 0) {
    const InvalidError = CustomError('CastError', { message: 'El monto de la orden debe ser menor o igual al monto del voucher', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()
  } else if (residue === 0) {
    isUsed = true
  }
  return { isUsed, residue }
}

const createOrder = async (body, loggedUser) => {
  // console.log('loggedUser',loggedUser)
  const { voucher } = body
  const dbVoucher = voucher && await findVoucher(voucher)
  if (voucher && dbVoucher) {
    const amount = body.amount
    if (amount > 0) {
      const residueBefore = dbVoucher.residue
      const { residue, isUsed } = getResidueVoucher(residueBefore, amount)
      const updateVoucher = await voucherDB.update(dbVoucher._id, {
        residue,
        isUsed
      })
      emitVoucher(updateVoucher, loggedUser)
      body.voucher.ref = updateVoucher
      body.status = 'Pagada' 
    } else {
      const InvalidError = CustomError('CastError', { message: 'El monto de la orden debe ser mayor o igual a 0', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  }
  const order = await orderDB.create(body)
  return order
}

const updateOrder = async (orderId, body, loggedUser) => {
  // console.log('loggedUser',loggedUser)
  const { voucher } = body
  const dbVoucher = voucher && await findVoucher(voucher)
  if (voucher && dbVoucher) {
    const amount = body.amount
    if (amount > 0) {
      const residueBefore = dbVoucher.residue
      const { residue, isUsed } = getResidueVoucher(residueBefore, amount)
      const updateVoucher = await voucherDB.update(dbVoucher._id, {
        residue,
        isUsed
      })
      emitVoucher(updateVoucher, loggedUser)
      body.voucher.ref = updateVoucher
      body.status = 'Pagada'
    } else {
      const InvalidError = CustomError('CastError', { message: 'El monto de la orden debe ser mayor o igual a 0', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
    }
  }
  const order = await orderDB.update(orderId, body)
  return order
}

const updateOrderAdmin = async (orderId, body, loggedUser) => {
  // console.log('loggedUser',loggedUser)
  const order = await orderDB.updateOne(orderId, body)
  return order
}

const detailOrder = async params => {
  const order = await orderDB.detail(params)
  return order
}

const deleteOrder = async (orderId, loggedUser) => {
  const order = await orderDB.remove(orderId)
  return order
}

const countDocuments = async params => {
  const count = await orderDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listOrders,
  assessorOrders,
  createOrder,
  updateOrder,
  updateOrderAdmin,
  detailOrder,
  deleteOrder
}
