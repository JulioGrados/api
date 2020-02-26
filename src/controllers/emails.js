'use strict'

const service = require('../services/email')

const listEmails = async (req, res) => {
  const emails = await service.listEmails(req.query)
  return res.status(200).json(emails)
}

const createEmail = async (req, res) => {
  try {
    const email = await service.createEmail(req.body, req.email)
    return res.status(201).json(email)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateEmail = async (req, res) => {
  const emailId = req.params.id
  try {
    const email = await service.updateEmail(emailId, req.body, req.email)
    return res.status(200).json(email)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailEmail = async (req, res) => {
  const emailId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = emailId
  } else {
    params.query = {
      _id: emailId
    }
  }

  try {
    const email = await service.detailEmail(params)
    return res.status(200).json(email)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteEmail = async (req, res) => {
  const emailId = req.params.id
  try {
    const email = await service.deleteEmail(emailId, req.email)
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
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail
}
