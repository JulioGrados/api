'use strict'

const { receiptDB, orderDB } = require('../db')
const { saveFile } = require('utils/files/save')
const CustomError = require('custom-error-instance')

const listReceipts = async params => {
  const receipts = await receiptDB.list(params)
  return receipts
}

const createReceipt = async (body, files, loggedUser) => {
  if (body.code) {
    if (body.orders && body.orders.length) {
      if (files) {
        for (const label in files) {
          const route = await saveFile(files[label], '/receipts')
          body[label] = route
        }
      }
      body.status = 'Finalizada'
      const receipt = await receiptDB.create(body)
      const orders = await prepareOrders(body.orders, receipt, 'Cancelada')
      const bdReceipt = await receiptDB.detail({
        query: { _id: receipt._id },
        populate: { path: 'orders' }
      })
      return bdReceipt
    } else {
      const InvalidError = CustomError('CastError', { message: 'No existe ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  } else {
    if (body.orders && body.orders.length) {
      if (files) {
        for (const label in files) {
          const route = await saveFile(files[label], '/receipts')
          body[label] = route
        }
      }
      const receipt = await receiptDB.create(body)
      const orders = await prepareOrders(body.orders, receipt, 'Usada')
      const bdReceipt = await receiptDB.detail({
        query: { _id: receipt._id },
        populate: { path: 'orders' }
      })
      return bdReceipt
    } else {
      const InvalidError = CustomError('CastError', { message: 'No existe ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  }
}

const prepareOrders = async (orders, receipt, status) => {
  let results
  try {
    results = await Promise.all(
      orders.map(async order => {
        const orderRes = await orderDB.update(order._id, {
          status: status,
          receipt: {
            ...receipt.toJSON(),
            ref: receipt.toJSON()
          }
        })
        return orderRes
      })
    )
  } catch (error) {
    const errorMessage = {
      status: error.status || 500,
      message: error.message || 'Error al crear las ordenes',
      error
    }
    throw errorMessage
  }
  return results
}

const updateReceipt = async (receiptId, body, files, loggedUser) => {
  if (body.code) {
    if (body.orders && body.orders.length) {
      if (files) {
        for (const label in files) {
          const route = await saveFile(files[label], '/receipts')
          body[label] = route
        }
      }
      body.status = 'Finalizada'
      const receipt = await receiptDB.update(receiptId, body)
      const orders = await prepareOrders(body.orders, receipt, 'Cancelada')
      const bdReceipt = await receiptDB.detail({
        query: { _id: receipt._id },
        populate: { path: 'orders' }
      })
      return bdReceipt
    } else {
      const InvalidError = CustomError('CastError', { message: 'No existe ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  } else {
    if (body.orders && body.orders.length) {
      if (files) {
        for (const label in files) {
          const route = await saveFile(files[label], '/receipts')
          body[label] = route
        }
      }
      const receipt = await receiptDB.update(receiptId, body)
      const orders = await prepareOrders(body.orders, receipt, 'Usada')
      const bdReceipt = await receiptDB.detail({
        query: { _id: receipt._id },
        populate: { path: 'orders' }
      })
      return bdReceipt
    } else {
      const InvalidError = CustomError('CastError', { message: 'No existe ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive)
      throw new InvalidError()
    }
  }
}

const detailReceipt = async params => {
  const receipt = await receiptDB.detail(params)
  return receipt
}

const detailAdminReceipt = async (params, receiptId) => {
  const receipt = await receiptDB.detail(params)
  const orders = await orderDB.list({ query: { 'receipt.ref': receiptId } })

  return {
    ...receipt.toJSON(),
    orders: orders ? orders : []
  }
}

const deleteReceipt = async (receiptId, loggedUser) => {
  const receipt = await receiptDB.remove(receiptId)
  return receipt
}

const deleteAdminReceipt = async receiptId => {
  try {
    const orders = await orderDB.list({ query: { 'receipt.ref': receiptId } })
    const result = await Promise.all(
      orders.map(async order => {
        const orderRes = await orderDB.update(order._id, {
          receipt: undefined,
          status: 'Pagada'
        })
        return orderRes
      })
    )
    console.log('result', result)
  } catch (error) {
    throw error
  }

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
  detailAdminReceipt,
  deleteReceipt,
  deleteAdminReceipt
}
