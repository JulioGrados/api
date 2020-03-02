'use strict'

const { saleDB, voucherDB, receiptDB } = require('../db')

/* Basicos */
const listSales = async params => {
  const sales = await saleDB.list(params)
  return sales
}

const createSale = async (body, loggedUser) => {
  body.orders = await prepareOrders(body)
  body.status = getStatusSale(body)
  const sale = await saleDB.create(body)
  return sale
}

const updateSale = async (saleId, body, loggedUser) => {
  if (body.status === 'Pendiente' || body.status === 'Pagando') {
    body.orders = await prepareOrders(body)
    body.status = getStatusSale(body)
    const sale = await saleDB.update(saleId, body)
    return sale
  } else {
    const error = {
      status: 402,
      message: 'La venta ya no se puede editar.'
    }
    throw error
  }
}

const detailSale = async params => {
  const sale = await saleDB.detail(params)
  return sale
}

const deleteSale = async (saleId, loggedUser) => {
  const sale = await saleDB.detail({ query: { _id: saleId } })
  await saleDB.remove(saleId)
  return sale
}

const countDocuments = async params => {
  const count = await saleDB.count(params)
  return count
}

/* functions */

const prepareOrders = async ({ orders, amount, user }) => {
  let sum = sumOrders(orders)

  if (sum !== amount) {
    const error = {
      status: 402,
      message:
        'La suma de montos de las ordenes debe coincidir con el monto de la venta'
    }
    throw error
  }

  let results
  try {
    results = await Promise.all(
      orders.map(async order => await changeOrder(order, user))
    )
  } catch (error) {
    const errorMessage = {
      status: 500,
      message: error.message || 'Error al crear las ordenes',
      error
    }
    throw errorMessage
  }

  return results
}

const changeOrder = async (order, linked) => {
  try {
    if (order.status === 'Por Pagar') {
      if (order.voucher) {
        order.status = 'Pagada'
        order.paymentDate = Date()
        const voucher = await addOrEditVoucher(
          order.voucher,
          order,
          order.assigned
        )
        order.voucher.code = voucher.code
        order.voucher.ref = voucher

        if (order.receipt) {
          const { isBill, ruc, dni, name, businessName } = order.receipt
          const data = { isBill, ruc, dni, name, businessName }
          const receipt = await addOrEditReceipt(data, order.assigned, linked)

          order.receipt.code = receipt.code
          order.receipt.ref = receipt
        }
      }
    } else {
      if (order.receipt && order.receipt.status === 'Pendiente') {
        const { isBill, ruc, dni, name, businessName, _id, ref } = order.receipt
        const data = { isBill, ruc, dni, name, businessName, _id: _id || ref }
        const receipt = await addOrEditReceipt(data, order.assigned, linked)
        order.receipt.code = receipt.code
        order.receipt.ref = receipt
      }
    }
    return order
  } catch (error) {
    throw error
  }
}

const addOrEditVoucher = async (voucher, order, assigned) => {
  try {
    const dbVoucher = await voucherDB.detail({ query: { code: voucher.code } })
    const { residue, isUsed } = getResidueVoucher(
      dbVoucher.residue,
      order.amount
    )
    const updateVoucher = await voucherDB.update(dbVoucher._id, {
      residue,
      isUsed
    })
    return updateVoucher
  } catch (error) {
    if (error.status && error.status === 404) {
      try {
        const { residue, isUsed } = getResidueVoucher(
          voucher.amount,
          order.amount
        )
        const newVoucher = await voucherDB.create({
          ...voucher,
          assigned,
          residue,
          isUsed
        })
        return newVoucher
      } catch (error) {
        throw error
      }
    } else {
      throw error
    }
  }
}

const getResidueVoucher = (voucherAmount, orderAmount) => {
  const residue = voucherAmount - orderAmount
  let isUsed = false
  if (residue < 0) {
    const error = {
      status: 402,
      message:
        'El monto de la orden debe ser menor o igual al monto del voucher'
    }
    throw error
  } else if (residue === 0) {
    isUsed = true
  }
  return { isUsed, residue }
}

const addOrEditReceipt = async (receipt, assigned, linked) => {
  try {
    if (!receipt.ref) {
      const newReceipt = await receiptDB.create({
        ...receipt,
        assigned,
        linked
      })
      return newReceipt
    } else {
      await receiptDB.update(receipt._id, { ...receipt })
      return receipt.ref
    }
  } catch (error) {
    throw error
  }
}

const getStatusSale = ({ orders, amount }) => {
  let sum = sumOrders(orders, 'Pagada')

  if (sum === amount) {
    return 'Finalizada'
  } else if (sum === 0) {
    return 'Pendiente'
  } else {
    return 'Pagando'
  }
}

const sumOrders = (orders, status = '') => {
  let sum = 0
  orders.forEach(item => {
    if (status) {
      if (item.status === status) {
        sum += item.amount
      }
    } else {
      sum += item.amount
    }
  })
  return sum
}

const sumCourses = (courses, status) => {
  let sum = 0
  courses.forEach(item => {
    if (status) {
      if (item.status === status) {
        sum += item.price
      }
    } else {
      sum += item.price
    }
  })
  return sum
}

module.exports = {
  countDocuments,
  listSales,
  createSale,
  updateSale,
  detailSale,
  deleteSale,
  /* functions */
  prepareOrders,
  changeOrder,
  addOrEditReceipt,
  addOrEditVoucher,
  getStatusSale,
  sumOrders,
  sumCourses
}
