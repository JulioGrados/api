'use strict'

const service = require('../services/meta')

const listMetas = async (req, res) => {
  const metas = await service.listMetas(req.query)
  return res.status(200).json(metas)
}

const createMeta = async (req, res) => {
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files

  try {
    const meta = await service.createMeta(body, files, req.user)
    return res.status(201).json(meta)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const updateMeta = async (req, res) => {
  const metaId = req.params.id
  const body = req.body.data ? JSON.parse(req.body.data) : req.body
  const files = req.files
  console.log(body)
  console.log(files)
  try {
    const meta = await service.updateMeta(metaId, body, files, req.whatsapp)
    return res.status(200).json(meta)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 500).json(error)
  }
}

const detailMeta = async (req, res) => {
  const metaId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = metaId
  } else {
    params.query = {
      _id: metaId
    }
  }

  try {
    const whatsapp = await service.detailMeta(params)
    return res.status(200).json(whatsapp)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteMeta = async (req, res) => {
  const metaId = req.params.id
  try {
    const meta = await service.deleteMeta(metaId, req.whatsapp)
    return res.status(201).json(meta)
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
  listMetas,
  createMeta,
  updateMeta,
  detailMeta,
  deleteMeta
}
