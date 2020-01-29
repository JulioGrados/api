'use strict'

const serviceTemplate = require('../services/template')

const listTemplates = async (req, res) => {
  const templates = await serviceTemplate.listTemplates(req.query)
  return res.status(200).json(templates)
}

const createTemplate = async (req, res) => {
  try {
    const template = await serviceTemplate.createTemplate(req.body, req.user)
    return res.status(201).json(template)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateTemplate = async (req, res) => {
  const templateId = req.params.id
  try {
    const template = await serviceTemplate.updateTemplate(templateId, req.body, req.user)
    return res.status(200).json(template)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailTemplate = async (req, res) => {
  const templateId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = templateId
  } else {
    params.query = {
      _id: templateId
    }
  }

  try {
    const template = await serviceTemplate.detailTemplate(params)
    return res.status(200).json(template)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteTemplate = async (req, res) => {
  const templateId = req.params.id
  try {
    await serviceTemplate.deleteTemplate(templateId, req.user)
    return res.status(201).json()
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listTemplates,
  createTemplate,
  updateTemplate,
  detailTemplate,
  deleteTemplate
}
