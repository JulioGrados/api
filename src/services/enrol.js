'use strict'
const fs = require('fs');
const { enrolDB } = require('../db')
const { sendEmail } = require('utils/lib/sendgrid')

const listEnrols = async params => {
  const enrols = await enrolDB.list(params)
  return enrols
}

const createEnrol = async (body, loggedUser) => {
  const enrol = await enrolDB.create(body)
  return enrol
}

const createEmailEnrol = async (body) => {
  const msg = {
    to: body.to,
    from: 'docente@eai.edu.pe',
    subject: body.subject,
    text: body.text,
    html: body.html,
    fromname: body.fromname,
    attachments: [
      {
        filename: `constancia.pdf`,
        content: body.pdf,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  }
  const enrol = await sendEmail(msg)
  return enrol
}

const updateEnrol = async (enrolId, body, loggedUser) => {
  const enrol = await enrolDB.update(enrolId, body)
  return enrol
}

const detailEnrol = async params => {
  const enrol = await enrolDB.detail(params)
  return enrol
}

const deleteEnrol = async (enrolId, loggedEnrol) => {
  const enrol = await enrolDB.remove(enrolId)
  return enrol
}

const countDocuments = async params => {
  const count = await enrolDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listEnrols,
  createEnrol,
  createEmailEnrol,
  updateEnrol,
  detailEnrol,
  deleteEnrol
}
