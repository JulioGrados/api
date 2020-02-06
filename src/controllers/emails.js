'use strict'

const serviceEmail = require('../services/email')

const listEmails = async (req, res) => {
  const emails = await serviceEmail.listEmails(req.query)
  return res.status(200).json(emails)
}

const createEmail = async (req, res) => {
  try {
    const email = await serviceEmail.createemail(req.body, req.email)
    return res.status(201).json(email)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateEmail = async (req, res) => {
  const emailId = req.params.id
  try {
    const email = await serviceEmail.updateEmail(emailId, req.body, req.email)
    return res.status(200).json(email)
  } catch (error) {
    return res.status(error.status).json(error)
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
    const email = await serviceEmail.detailEmail(params)
    return res.status(200).json(email)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteEmail = async (req, res) => {
  const emailId = req.params.id
  try {
    const email = await serviceEmail.deleteEmail(emailId, req.email)
    return res.status(201).json(email)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail
}
