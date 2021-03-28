'use strict'

const service = require('../services/send')

const listSends = async (req, res) => {
  const sends = await service.listSends(req.query)
  return res.status(200).json(sends)
}

const createSend = async (req, res) => {
  try {
    const send = await service.createSend(req.body, req.send)
    return res.status(201).json(send)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 500).json(error)
  }
}

const updateSend = async (req, res) => {
  const sendId = req.params.id
  try {
    const send = await service.updateSend(sendId, req.body, req.send)
    return res.status(200).json(send)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailSend = async (req, res) => {
  const sendId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = sendId
  } else {
    params.query = {
      _id: sendId
    }
  }

  try {
    const send = await service.detailSend(params)
    return res.status(200).json(send)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteSend = async (req, res) => {
  const sendId = req.params.id
  try {
    const send = await service.deleteSend(sendId, req.send)
    return res.status(201).json(email)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listSends,
  createSend,
  updateSend,
  detailSend,
  deleteSend
}
