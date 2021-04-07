'use strict'

const { saleDB, voucherDB, receiptDB, dealDB, progressDB, userDB } = require('../db')
const { sumAmountOrders } = require('utils/functions/sale')
const { saveFile } = require('utils/files/save')
const { emitDeal } = require('./deal')

/* Basicos */
const listSales = async params => {
  const sales = await saleDB.list(params)
  return sales
}

const createSale = async (body, files, loggedUser) => {
  const copyOrders = JSON.parse(JSON.stringify(body.orders))
  body.orders = await prepareOrders(body, files)
  body.status = getStatusSale(body)
  const sale = await saleDB.create(body)
  try {
    sale.orders = await editVoucher(sale.orders, copyOrders)
    changeStatusUser(sale, body.detail)
  } catch (error) {
    await sale.remove()
    throw error
  }
  return sale
}

const updateSale = async (saleId, body, files, loggedUser) => {
  if (body.status === 'Pendiente' || body.status === 'Pagando' || body.status === 'Finalizada') {
    const copyOrders = JSON.parse(JSON.stringify(body.orders))
    body.orders = await prepareOrders(body, files)
    body.status = getStatusSale(body)
    const sale = await saleDB.update(saleId, body)
    sale.orders = await editVoucher(sale.orders, copyOrders)
    changeStatusUser(sale, body.detail)
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

const editVoucher = async (orders, dataOrders) => {
  try {
    const newOrders = await Promise.all(
      orders.map(async order => {
        const data = dataOrders.find(
          data => data.quotaNumber === order.quotaNumber
        )
        if (data && data.status === 'Por Pagar' && data.voucher) {
          const amount = order.amount
          const voucherAmount = order.voucher.ref.residue
          const { residue, isUsed } = getResidueVoucher(voucherAmount, amount)
          const updateVoucher = await voucherDB.update(order.voucher.ref._id, {
            residue,
            isUsed
          })

          order.voucher.ref = updateVoucher
        }
        return order
      })
    )
    return newOrders
  } catch (error) {
    if (error.status && error.message) {
      throw error
    } else {
      const errorMsg = {
        status: 500,
        message: 'error al gurdar las ordenes'
      }
      throw errorMsg
    }
  }
}

const prepareOrders = async ({ orders, amount, user }, files) => {
  const sum = sumAmountOrders(orders)

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
    console.log('order length', orders.length)
    results = await Promise.all(
      orders.map(async order => {
        console.log('order', order)
        const orderRes = await changeOrder(order, user, files)
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

const changeOrder = async (order, linked, files) => {
  try {
    if (order.voucher) {
      order.status = 'Pagada'
      order.paymentDate = Date()
      const voucher = await findOrAddVoucher(
        order.voucher,
        order.amount,
        order.assigned,
        files
      )
      order.voucher.code = voucher.code
      order.voucher.ref = voucher
      if (order.receipt) {
        const { _id, isBill, ruc, dni, name, businessName, code } = order.receipt
        const data = { isBill, ruc, dni, name, businessName, code, _id }
        const receipt = await findOrAddReceipt(data, files, order.assigned, linked)
        order.receipt.code = receipt.code
        order.receipt.ref = receipt
      }
    }
    return order
  } catch (error) {
    if (error.status && error.message) {
      throw error
    } else {
      const errorMsg = {
        status: 500,
        message: 'error al guardar la orden'
      }
      throw errorMsg
    }
  }
}

const findVoucher = async (voucher) => {
  try {
    const dbVoucher = await voucherDB.detail({ query: { code: voucher.code } })
    
    return dbVoucher
  } catch (error) {
      const errorMsg = {
        status: 402,
        message: 'No existe voucher'
      }
      throw errorMsg
  }
}

const findOrAddVoucher = async (voucher, orderAmount, assigned, files) => {
  try {
    if (voucher._id) {
      console.log('con id voucher')
      getResidueVoucher(voucher.amount, orderAmount)
      if (files) {
        const file = files[voucher.code]
        if (file) {
          const route = await saveFile(file, '/vouchers')
          voucher.image = route
        }
      }
      const updateVoucher = await voucherDB.update( voucher._id, {
        ...voucher,
        bank: voucher.bank && {
          ...voucher.bank,
          name: voucher.bank.label
        },
        assigned,
        residue: voucher.amount,
        isUsed: true
      })
      return updateVoucher
    } else {
      console.log('no existe voucher')
      getResidueVoucher(voucher.amount, orderAmount)
      if (files) {
        const file = files[voucher.code]
        if (file) {
          const route = await saveFile(file, '/vouchers')
          voucher.image = route
        }
      }
      const data = {
        ...voucher,
        bank: voucher.bank && {
          ...voucher.bank,
          name: voucher.bank.label
        },
        code: voucher.code,
        assigned,
        residue: voucher.amount,
        isUsed: false
      }
      const newVoucher = await voucherDB.create(data)
      console.log('new voocher', newVoucher)
      return newVoucher
    }
  } catch (error) {
    throw error
  }
}

const getResidueVoucher = (voucherAmount, orderAmount) => {
  const residue = parseFloat(voucherAmount) - parseFloat(orderAmount)
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

const findOrAddReceipt = async (receipt, files, assigned, linked) => {
  try {
    if (receipt._id || receipt.ref) {
      receipt.status = 'Procesado'
      const ref = receipt._id ? receipt._id : receipt.ref
      if (files) {
        const file = files[receipt.code]
        if (file) {
          const route = await saveFile(file, '/receipts')
          receipt.file = route
        }
      }
      const updateReceipt = await receiptDB.update(ref, {
        ...receipt,
        assigned,
        linked
      })
      return updateReceipt
    } else {
      delete receipt.code
      receipt.status = 'Procesado'
      if (files) {
        const file = files[receipt.code]
        if (file) {
          const route = await saveFile(file, '/receipts')
          receipt.file = route
        }
      }
      const newReceipt = await receiptDB.create({
        ...receipt,
        assigned,
        linked
      })
      return newReceipt
    }
  } catch (error) {
    throw error
  }
}

const getStatusSale = ({ orders, amount }) => {
  const sum = sumAmountOrders(orders, 'Pagada')

  if (sum === amount) {
    return 'Finalizada'
  } else if (sum === 0) {
    return 'Pendiente'
  } else {
    return 'Pagando'
  }
}

const changeStatusUser = async sale => {
  if (sale.status === 'Pagando' || sale.status === 'Finalizada') {
    const progress = await progressDB.detail({ query: { key: 'won' } })
    let progressPayment
    if (progress) {
      progressPayment = {
        name: progress.name,
        ref: progress._id
      }
    }

    if (sale.user && sale.user.ref) {
      const user = await userDB.detail({ query: { _id: sale.user.ref } })

      if (user) {
        await userDB.update(user._id, {
          roles: [...user.roles, 'Cliente']
        })
      }
    }
    const statusActivity = 'done'
    const status = 'Ganado'

    const updateDeal = await dealDB.update(sale.deal, {
      progressPayment,
      statusActivity,
      status
    })
    emitDeal(updateDeal)
  }
}

module.exports = {
  countDocuments,
  listSales,
  createSale,
  updateSale,
  detailSale,
  deleteSale
}
