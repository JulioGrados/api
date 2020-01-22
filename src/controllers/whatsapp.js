'use strict'

const serviceWhatsapp = require('../services/whatsapp')

const listWhatsapps = async (req, res) => {
  const whatsapps = await serviceWhatsapp.listWhatsapps(req.query)
  return res.status(200).json(whatsapps)
}

const createWhatsapp = async (req, res) => {
  try {
    const whatsapp = await serviceWhatsapp.createWhatsapp(req.body, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateWhatsapp = async (req, res) => {
  const whatsappId = req.params.id
  try {
    const whatsapp = await serviceWhatsapp.updateWhatsapp(whatsappId, req.body, req.whatsapp)
    return res.status(200).json(whatsapp)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailWhatsapp = async (req, res) => {
  const whatsappId = req.params.id
  const params = req.query
  if(params.query) {
    params.query._id = whatsappId
  } else {
    params.query = {
      _id: whatsappId
    }
  }

  try {
    const whatsapp = await serviceWhatsapp.detailWhatsapp(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteWhatsapp = async (req, res) => {
  const whatsappId = req.params.id
  try {
    await serviceWhatsapp.deleteWhatsapp(whatsappId, req.whatsapp)
    return res.status(204).json()
  }catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  detailWhatsapp,
  deleteWhatsapp
}