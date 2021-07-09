'use strict'

const service = require('../services/email')

const listEmails = async (req, res) => {
  const emails = await service.listEmails(req.query)
  return res.status(200).json(emails)
}

const createEmail = async (req, res, next) => {
  try {
    const email = await service.createEmail(req.body, req.email)
    return res.status(201).json(email)
  } catch (error) {
    next(error)
  }
}

const resendEmail = async (req, res, next) => {
  try {
    const email = await service.resendEmail(req.body, req.email)
    return res.status(201).json(email)
  } catch (error) {
    next(error)
  }
}

const createSendEmail = async (req, res, next) => {
  try {
    const email = await service.createSendEmail(req.body, req.email)
    return res.status(201).json(email)
  } catch (error) {
    next(error)
  }
}

const updateEmail = async (req, res, next) => {
  const emailId = req.params.id
  try {
    const email = await service.updateEmail(emailId, req.body, req.email)
    return res.status(200).json(email)
  } catch (error) {
    next(error)
  }
}

const detailEmail = async (req, res, next) => {
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
    next(error)
  }
}

const deleteEmail = async (req, res, next) => {
  const emailId = req.params.id
  try {
    const email = await service.deleteEmail(emailId, req.email)
    return res.status(201).json(email)
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
  listEmails,
  createEmail,
  resendEmail,
  updateEmail,
  detailEmail,
  deleteEmail,
  createSendEmail
}
