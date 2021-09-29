'use strict'

const { receiptDB, orderDB, courseDB } = require('../db')
const { saveFile } = require('utils/files/save')
const CustomError = require('custom-error-instance')
const { payloadTicket, setFacture, unsubscribeReceipt, payloadFacture } = require('utils/functions/receipt')
const { filePdf } = require('utils/functions/file')
const { companyDB } = require('../../../db/lib')
const { sendEmailOnly } = require('utils/lib/sendgrid')
const { getBase64 } = require('utils/functions/base64')
const { MEDIA_PATH } = require('utils/files/path')
const { createEmailLinked } = require('./email')
const { templateReceipt } = require('utils/emails/receipt')

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

const sendFacture = async (body) => {
  try {
    const attachment = await getBase64(MEDIA_PATH + body.file)
    const sendEmail = await createEmailLinked({
      to: body.isBill ? body.send : body.email,
      deal: body.deal,
      assigned: body.assigned,
      from: 'cursos@eai.edu.pe',
      fromname: 'Escuela Americana de Innovación',
      subject: `Haz recibido una ${body.isBill ? 'Factura' : 'Boleta'} Electrónica Nro. ${body.code} de Escuela Americana de Innovación S.A.C.`,
      preheader: 'Comprobante de Pago',
      type: body.isBill ? 'Factura' : 'Boleta',
      content: templateReceipt(body),
      attachments: [
        {
          filename: 'comprobante.pdf',
          url: MEDIA_PATH + body.file
        }
      ]
    })
    const email = await sendEmailReceipt({
      to: body.isBill ? body.send : body.email,
      firstName: body.isBill ? body.businessName: body.firstName,
      type: body.isBill ? 'Factura' : 'Boleta',
      code: body.code,
      from: 'cursos@eai.edu.pe',
      fromname: 'Escuela Americana de Innovación',
      text: 'Comprobante de Pago',
      pdf: attachment
    })
    return {
      success: true
    }
  } catch (error) {
    throw error
  }
  
}

const sendEmailReceipt = async (body) => {
  const msg = {
    to: body.to,
    from: body.from,
    subject: `${body.type} Electrónica Nro. ${body.code} de Escuela Americana de Innovación S.A.C.`,
    text: body.text,
    preheader: body.preheader,
    fromname: body.froname,
    html: `
      Saludos ${body.firstName}
      <br><br>
      Se adjunta ${body.type} Electrónica Nro. ${body.code}.
      <br>
      Recuerde que para cualquier consulta administrativa puedes escribirnos a cursos@eai.edu.pe donde será un gusto atender sus consultas.
      <br><br>
      Gracias.
      <br><br>
      --
      <br>
      Atte.
      <br>
      Área Comercial
      <br>
      Escuela Americana de Innovación
      <br>
      Teléfono: (01)4800022
      <br>
      WhatsApp: https://wa.me/5114800022
      <br>
      Calle Las Camelias 877, Oficina 302 - San Isidro - Lima
    `,
    attachments: [
      {
        filename: `comprobante.pdf`,
        content: body.pdf,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  }
  const send = await sendEmailOnly(msg)
  return msg
}

const getItems = async orders => {
  return await Promise.all(
    orders.map(async (order, index) => {
      const tax = order.amount / 1.18
      const igv = parseFloat((order.amount - tax).toFixed(4))
      const course = await courseDB.detail({ query: { _id: order.course.ref } })
      
      return {
        quantity: parseFloat('1.0000'),
        price: parseFloat((order.amount - igv).toFixed(4)),
        price_tax: parseFloat((order.amount).toFixed(4)),
        unit: 'ZZ',
        unit_pdf: 'UND',
        sunat_tax_code: '10',
        tax_total_item: parseFloat(igv.toFixed(2)),
        tax_unit_item: parseFloat(igv.toFixed(4)),
        type_igv: '10',
        igv_percentage: '18.0000',
        description: course.name,
        detail: order.amount.toString(),
        system_id: course.moodleId,
        correlative: (index + 1).toString(),
        type: '2002'
      }
    })
  )
}

const createFacture = async (receiptId, body) => {
  if (body.orders && body.orders.length) {
    if (body.isBill) {
      if (body.send) {
        try {
          const count = await receiptDB.count({ query: { isFacture: true } })
          const company = await companyDB.detail({ query: { ruc: body.ruc } })
          const items = await getItems(body.orders)
          const ticket = payloadFacture({
            receipt: body,
            items: items,
            company: company,
            count: count ? count + 1 : 1
          })
          console.log('ticket', ticket)
          const create = await setFacture(ticket)
          const fileroot = await filePdf(create.data.pdf_base64, create.data.voucher_id)
          const receipt = await receiptDB.update(receiptId, {
            status: 'Finalizada',
            isFacture: true,
            file: fileroot,
            ruc: company.ruc,
            businessName: company.businessName,
            address: company.address,
            send: body.send,
            voucher_id: create.data.voucher_id,
            code: ticket.nro_document,
            serie: 'FA01',
            sequential: ticket.sequential
          })

          const sendEmail = await createEmailLinked({
            to: body.send,
            deal: receipt.deal,
            assigned: receipt.assigned,
            from: 'cursos@eai.edu.pe',
            fromname: 'Escuela Americana de Innovación',
            preheader: 'Comprobante de Pago',
            subject: `Factura Electrónica Nro. ${receipt.code} de Escuela Americana de Innovación S.A.C.`,
            type: 'Factura',
            content: templateReceipt(receipt),
            attachments: [
              {
                filename: 'comprobante.pdf',
                url: MEDIA_PATH + receipt.file
              }
            ]
          })
          
          const email = await sendEmailReceipt({
            to: body.send,
            firstName: company.businessName,
            type: 'Factura',
            code: ticket.nro_document,
            from: 'cursos@eai.edu.pe',
            preheader: 'Comprobante de Pago',
            fromname: 'Escuela Americana de Innovación',
            text: 'Comprobante de Pago',
            pdf: create.data.pdf_base64
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
        const InvalidError = CustomError('CastError', { message: 'La factura no tiene un email asociado.', code: 'EINVLD' }, CustomError.factory.expectReceive)
        throw new InvalidError()
      }
    } else {
      if (body.email) {
        try {
          const count = await receiptDB.count({ query: { isTicket: true }})
          const { firstName, lastName, dni, document } = body 
          const items = await getItems(body.orders)
          const ticket = payloadTicket({
            receipt: body,
            items: items,
            user: { firstName: firstName, lastName: lastName, dni: dni, document: document },
            count: count ? count + 5 : 5
          })
          console.log('ticket', ticket)
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
            email: body.email,
            code: ticket.nro_document,
            serie: 'BA01',
            voucher_id: create.data.voucher_id,
            sequential: ticket.sequential
          })

          const sendEmail = await createEmailLinked({
            to: body.email,
            deal: receipt.deal,
            assigned: receipt.assigned,
            from: 'cursos@eai.edu.pe',
            fromname: 'Escuela Americana de Innovación',
            preheader: 'Comprobante de Pago',
            subject: `Boleta Electrónica Nro. ${receipt.code} de Escuela Americana de Innovación S.A.C.`,
            type: 'Boleta',
            content: templateReceipt(receipt),
            attachments: [
              {
                filename: 'comprobante.pdf',
                url: MEDIA_PATH + receipt.file
              }
            ]
          })

          const email = await sendEmailReceipt({
            to: body.email,
            firstName: firstName,
            type: 'Boleta',
            code: ticket.nro_document,
            from: 'cursos@eai.edu.pe',
            preheader: 'Comprobante de Pago',
            fromname: 'Escuela Americana de Innovación',
            text: 'Comprobante de Pago',
            pdf: create.data.pdf_base64
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
        const InvalidError = CustomError('CastError', { message: 'La boleta no tiene un email asociado.', code: 'EINVLD' }, CustomError.factory.expectReceive)
        throw new InvalidError()
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

const updateAdminReceipt = async (receiptId, body, loggedUser) => {
  if (!body.voucher_id || !body.annular) {
    const InvalidError = CustomError('CastError', { message: 'La anulación necesita de un voucher ID y asunto.', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()  
  }

  if (body.unsubscribe) {
    const InvalidError = CustomError('CastError', { message: 'La anulación ya ha sido realizada.', code: 'EINVLD' }, CustomError.factory.expectReceive);
    throw new InvalidError()  
  }
  
  try {
    const unsubscribe = await unsubscribeReceipt({
      voucher_id: body.voucher_id,
      reason: body.annular
    })
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
    const receipt = await receiptDB.update(receiptId, {
      status: 'Anulada',
      unsubscribe: true,
      annular: body.annular
    })
    return receipt
  } catch (error) {
    if (error && error.error) {
      const InvalidError = CustomError('CastError', { message: error.error, code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()  
    } else {
      throw error
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

const onlyUpdateReceipt = async (receiptId, body, loggedUser) => {
  const receipt = await receiptDB.update(receiptId, body)
  return receipt
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
  sendFacture,
  onlyUpdateReceipt,
  updateReceipt,
  detailReceipt,
  detailAdminReceipt,
  updateAdminReceipt,
  deleteReceipt,
  deleteAdminReceipt
}
