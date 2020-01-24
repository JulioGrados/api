'use strict'

const { emailDB } = require('../db')

const listEmails = async (params) => {
  const emails = await emailDB.list(params)
  return emails
}

const createEmail = async (body, loggedEmail) => {
  const email = await emailDB.create(body)
  return email
}

const updateEmail = async (emailId, body, loggedEmail) => {
  const email = await emailDB.update(emailId, body)
  return email
}

const detailEmail = async (params) => {
  const email = await emailDB.detail(params)
  return email
}

const deleteEmail = async (emailId, loggedEmail) => {
  const email = await emailDB.remove(emailId)
  return email
}

module.exports = {
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail
}
