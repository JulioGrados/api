'use strict'

const { chargeDB, userDB, dealDB } = require('../db')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')
const { paymentPaycash, getToken } = require('utils/functions/paycash')
const countriesDataOriginal  = require('utils/functions/originalCountries')
const { getSocket } = require('../lib/io')

const listCharges = async params => {
  console.log('--------------------------------------------------------')
  console.log('charge')
  console.log('--------------------------------------------------------')
  const charges = await chargeDB.list(params)
  return charges
}

const createCharge = async (body, loggedCharge) => {
  try {
    const expiration = moment().add('days', 7).format('YYYY-MM-DD') 
    const data = {
      Amount: body.amount,
      ExpirationDate: expiration,
      Value: body.deal._id,
      Type: true
    }
    
    const country = body.money && countriesDataOriginal.find(o => o.code == body.money)
    const lowerCountry = country.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const token = await getToken(lowerCountry)
    const payment = await paymentPaycash(JSON.stringify(data), token.data.Authorization, lowerCountry)
    const dataCharge = {
      ...body,
      statusPayment: 'Por Pagar',
      endDate: expiration,
      reference: payment.data.Reference,
      token: token.data.Authorization,
      money: body.money ? body.money : ''
    }
    const charge = await chargeDB.create(dataCharge)
    const detail = await chargeDB.detail({query : {_id: charge._id.toString()}, populate: ['linked.ref']})
    return detail
  } catch (error) {
    throw error
  }
}

const updateCharge = async (chargeId, body, loggedCharge) => {
  const charge = await chargeDB.update(chargeId, body)
  return charge
}

const updateStatusCharge = async (body, loggedCall) => {
  const charge = await chargeDB.detail({ query: { reference: body.Referencia } })
  console.log('charge', charge)
  const deal = await dealDB.detail({ query: { _id: charge.deal.toString() }, populate: ['client'] })
  console.log('deal', deal)
  const chargeUpdate = await chargeDB.update(charge._id, {
    statusPayment: 'Pago',
    payDate: body.FechaConfirmation,
    authorization: body.Autorizacion
  })
  emitCharge(chargeUpdate, deal.assessor)
  emitPopUpCharge({
    ...deal.toJSON(),
    ...chargeUpdate.toJSON(),
    ref: deal._id
  }, deal.assessor)
  return chargeUpdate
}

const detailCharge = async params => {
  const charge = await chargeDB.detail(params)
  return charge
}

const deleteCharge = async (chargeId, loggedCharge) => {
  const charge = await chargeDB.remove(chargeId)
  return charge
}

const countDocuments = async params => {
  const count = await chargeDB.count(params)
  return count
}

/* functions */

const emitCharge = (charge, assesor) => {
  if (assesor) {
    console.log('llamado charge', charge)
    console.log('llamado assesor', assesor)
    const io = getSocket()
    io.to(assesor.ref.toString()).emit('charge', charge)
  }
}

const emitPopUpCharge = (deal, assesor) => {
  console.log('deal send pop', deal)
  if (assesor) {
    console.log('pago entrante')
    const io = getSocket()
    io.to(assesor.ref.toString()).emit('popupcharge', deal)
  }
}


module.exports = {
  countDocuments,
  listCharges,
  createCharge,
  updateCharge,
  updateStatusCharge,
  detailCharge,
  deleteCharge
}