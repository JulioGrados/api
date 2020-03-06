'use strict'

const { emailDB } = require('../db')
const { sendEmail } = require('utils/lib/sendgrid')

const listEmails = async params => {
  const emails = await emailDB.list(params)
  return emails
}

const createEmail = async (body, loggedEmail) => {
  const email = await emailDB.create(body)
  const userEmail = {
    to: body.linked.ref.email,
    from: email.from,
    subject: email.preheader,
    html: email.content,
    args: {
      emailId: email._id
    }
  }
  sendEmail(userEmail)
  return email
}

const updateEmail = async (emailId, body, loggedEmail) => {
  const email = await emailDB.update(emailId, body)
  return email
}

const detailEmail = async params => {
  const email = await emailDB.detail(params)
  return email
}

const deleteEmail = async (emailId, loggedEmail) => {
  const email = await emailDB.remove(emailId)
  return email
}

const countDocuments = async params => {
  const count = await emailDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail
}
