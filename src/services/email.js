'use strict'

const { emailDB } = require('../db')
const { sendEmail, sendCrm } = require('utils/lib/sendgrid')
const { getSocket } = require('../lib/io')
const { createTimeline } = require('./timeline')

const listEmails = async params => {
  const emails = await emailDB.list(params)
  return emails
}

const createEmail = async (body, loggedUser) => {
  const dataEmail = prepareEmail(body)
  const email = await emailDB.create(dataEmail)
  if (email.template && email.template.ref) {
    sendEmailSengrid(email)
  } else {
    emitEmail(email)
  }
  return email
}

const updateEmail = async (emailId, body, loggedUser) => {
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

/* functions */

const prepareEmail = ({ template, ...data }) => {
  const { linked, assigned } = template || data
  // console.log('template', template)
  // console.log('data', data)
  // console.log('linked', linked)
  // console.log('linked names', linked.names)
  // console.log('assigned', assigned)
  const dataEmail = {
    ...data,
    linked: {
      names: linked.names,
      ref: linked._id
    },
    assigned: {
      username: assigned.username,
      ref: assigned._id ? assigned._id : assigned.ref ? assigned.ref._id : assigned.ref
    },
    template: template && {
      name: template.name,
      ref: template._id
    }
  }
  // console.log('dataEmail', dataEmail)
  return dataEmail
}

const sendEmailSengrid = ({ to, from, preheader, content, _id }) => {
  const userEmail = {
    to,
    from,
    subject: preheader,
    html: content,
    args: {
      emailId: _id
    }
  }
  console.log('userEmail', userEmail)
  sendCrm(userEmail)
}

const updateEmailTimeline = async (emailId, status, time) => {
  const email = await emailDB.detail({query: { _id: emailId }})

  if (email === null) {
    const error = {
      status: 404,
      message: 'El email que intentas editar no existe.'
    }
    throw error
  }
  // console.log('email', email)
  try {
    const timeline = createTimeline({
      linked: email.linked,
      deal: email.deal,
      assigned: email.assigned,
      type: 'Email',
      note: status,
      name: `[${status}] - ${email.preheader}`,
    })
    return timeline
  } catch (errorDB) {
    const error = parseErrorDB(errorDB)
    throw error
  }
}

const updateStatusEmail = async ({ emailId, event }) => {
  const email = await emailDB.detail({
    query: { _id: emailId },
    select: 'status'
  })
  // console.log('email', email)
  const status = getNewStatus(event)
  if (email.status !== status) {
    const updateEmail = await emailDB.update(email._id, { status })
    const timeline = await updateEmailTimeline(email._id, status, event.timestamp)
    emitEmail(updateEmail)
  }
}

const getNewStatus = event => {
  switch (event) {
    case 'delivered':
      return 'Entregado'
    case 'open':
      return 'Abierto'
    case 'click':
      return 'Click'
    case 'spamreport':
      return 'Spam'
    case 'bounce':
      return 'Rechazado'
    default:
      return event
  }
}

const emitEmail = email => {
  console.log('email.asigned', email.assigned)
  if (email.assigned) {
    const io = getSocket()
    io.to(email.assigned.ref).emit('email', email)
  }
}

module.exports = {
  countDocuments,
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail,
  updateStatusEmail
}
