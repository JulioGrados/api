'use strict'

const service = require('../services/whatsapp')

const listWhatsapps = async (req, res) => {
  const whatsapps = await service.listWhatsapps(req.query)
  return res.status(200).json(whatsapps)
}

const createWhatsapp = async (req, res, next) => {
  try {
    const whatsapp = await service.createWhatsapp(req.body, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const updateWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  try {
    const whatsapp = await service.updateWhatsapp(
      whatsappId,
      req.body,
      req.whatsapp
    )
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const detailWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = whatsappId
  } else {
    params.query = {
      _id: whatsappId
    }
  }

  try {
    const whatsapp = await service.detailWhatsapp(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const deleteWhatsapp = async (req, res, next) => {
  const whatsappId = req.params.id
  try {
    const whatsapp = await service.deleteWhatsapp(whatsappId, req.whatsapp)
    return res.status(201).json(whatsapp)
  } catch (error) {
    next(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listWhatsapps,
  createWhatsapp,
  updateWhatsapp,
  detailWhatsapp,
  deleteWhatsapp
}
