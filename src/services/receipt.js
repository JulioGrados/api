'use strict'

const { receiptDB, orderDB, courseDB } = require('../db')
const { saveFile } = require('utils/files/save')
const CustomError = require('custom-error-instance')
const { payloadTicket, setFacture, payloadFacture } = require('utils/functions/receipt')
const { filePdf } = require('utils/functions/file')
const { companyDB } = require('../../../db/lib')

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

const getItems = async orders => {
  return await Promise.all(
    orders.map(async order => {
      const tax = order.amount * 0.18
      const price = parseFloat((order.amount - tax).toFixed(2))
      const course = await courseDB.detail({ query: { _id: order.course.ref } })
      
      return {
        quantity: parseFloat('1.00'),
        price: price,
        price_tax: parseFloat(order.amount.toFixed(2)),
        unit: 'ZZ',
        tax_total_item: parseFloat(tax.toFixed(2)),
        tax_unit_item: parseFloat(tax.toFixed(2)),
        type_igv: '10',
        description: course.name,
        detail: order.amount.toString(),
        system_id: course.moodleId,
        correlative: '1',
        type: '2002'
      }
    })
  )
}

const createFacture = async (receiptId, body) => {
  if (body.orders && body.orders.length) {
    if (body.isBill) {
      try {
        const count = await receiptDB.count({ query: { isFacture: true } })
        const company = await companyDB.detail({ query: { ruc: body.ruc } })
        const items = await getItems(body.orders)
        const ticket = payloadFacture({
          receipt: body,
          items: items,
          company: company,
          count: count ? count + 2 : 2
        })
        // console.log('ticket', ticket)
        const create = await setFacture(ticket)
        const fileroot = await filePdf(create.data.pdf_base64, create.data.voucher_id)
        const receipt = await receiptDB.update(receiptId, {
          status: 'Finalizada',
          isFacture: true,
          file: fileroot,
          ruc: company.ruc,
          businessName: company.businessName,
          address: company.address,
          code: ticket.nro_document,
          serie: 'FA01',
          sequential: ticket.sequential
        })
        const orders = await prepareOrders(body.orders, receipt, 'Cancelada')
        const bdReceipt = await receiptDB.detail({
          query: { _id: receipt._id },
          populate: { path: 'orders' }
        })
        return bdReceipt
      } catch (error) {
        const data = error.data

        if (data) {
          const InvalidError = CustomError('CastError', { message: data.error, code: 'EINVLD' }, CustomError.factory.expectReceive)
          throw new InvalidError()
        } else {
          throw error 
        }
      }
    } else {
      try {
        const count = await receiptDB.count({ query: { isTicket: true }})
        const { firstName, lastName, dni } = body 
        const items = await getItems(body.orders)
        const ticket = payloadTicket({
          receipt: body,
          items: items,
          user: { firstName: firstName, lastName: lastName, dni: dni },
          count: count ? count + 21 : 21
        })
        // console.log('ticket', ticket)
        const create = await setFacture(ticket)
        const fileroot = await filePdf(create.data.pdf_base64, create.data.voucher_id)
        const receipt = await receiptDB.update(receiptId, {
          status: 'Finalizada',
          isTicket: true,
          file: fileroot,
          firstName: firstName,
          lastName: lastName,
          names: firstName + ' ' + lastName,
          dni: dni,
          code: ticket.nro_document,
          serie: 'BA01',
          sequential: ticket.sequential
        })
        const orders = await prepareOrders(body.orders, receipt, 'Cancelada')
        const bdReceipt = await receiptDB.detail({
          query: { _id: receipt._id },
          populate: { path: 'orders' }
        })
        return bdReceipt
      } catch (error) {
        const data = error.data

        if (data) {
          const InvalidError = CustomError('CastError', { message: data.error, code: 'EINVLD' }, CustomError.factory.expectReceive)
          throw new InvalidError()
        } else {
          throw error 
        }
      }
    }
  } else {
    const InvalidError = CustomError('CastError', { message: 'No existe ordenes', code: 'EINVLD' }, CustomError.factory.expectReceive)
    throw new InvalidError()
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
  createFacture,
  updateReceipt,
  detailReceipt,
  detailAdminReceipt,
  deleteReceipt,
  deleteAdminReceipt
}
