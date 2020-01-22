'use strict'

const {whastsappDB} = require('../db')

const listWhatsapps = async (params) => {
  const whatsapps = await whastsappDB.list(params)
  return whatsapps
}

const createWhatsapp = async (body, loggedUser) => {
  const whatsapp = await whastsappDB.create(body)
  return whatsapp
}

const updateWhatsapp = async (whatsappId, body, loggedUser) => {
  console.log("services")
  const whatsapp = await whastsappDB.update(whatsappId, body)
  return whatsapp
}

const detailWhatsapp = async (params) => {
  const whatsapp = await whastsappDB.detail(params)
  return whatsapp
}

const deleteWhatsapp = async (whatsappId, loggedUser) => {
  const whatsapp = await whastsappDB.remove(whatsappId)
  return whatsapp
}

module.exports = {
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  detailWhatsapp,
  deleteWhatsapp
}