'use strict'

const { whastsappDB } = require('../db')

const listWhatsapps = async params => {
  const whatsapps = await whastsappDB.list(params)
  return whatsapps
}

const createWhatsapp = async (body, loggedUser) => {
  const whatsapp = await whastsappDB.create(body)
  return whatsapp
}

const updateWhatsapp = async (whatsappId, body, loggedUser) => {
  const whatsapp = await whastsappDB.update(whatsappId, body)
  return whatsapp
}

const detailWhatsapp = async params => {
  const whatsapp = await whastsappDB.detail(params)
  return whatsapp
}

const deleteWhatsapp = async (whatsappId, loggedUser) => {
  const whatsapp = await whastsappDB.remove(whatsappId)
  return whatsapp
}

const countDocuments = async params => {
  const count = await whastsappDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  detailWhatsapp,
  deleteWhatsapp
}
