'use strict'

const { emailDB } = require('../db')
const { sendEmail } = require('utils/lib/sendgrid')
const { MEDIA_PATH } = require('utils/files/path')
const { getSocket } = require('../lib/io')

const listEmails = async params => {
  const emails = await emailDB.list(params)
  return emails
}

const createEmail = async (body, loggedUser) => {
  const dataEmail = prepareEmail(body)
  const email = await emailDB.create(dataEmail)
  emitEmail(email)
  if (email.template && email.template._id) {
    sendEmailSengrid(email)
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

const prepareEmail = ({ linked, assigned, template, from, ...args }) => {
  const { content, preheader } = replacleContent({
    ...args,
    linked,
    template,
    assigned
  })
  console.log('template', template)
  const data = {
    content,
    preheader,
    from,
    to: linked.email,
    sender: template ? template.sender : 'cursos@eai.edu.pe',
    template: template && {
      name: template.name,
      ref: template._id
    },
    linked: {
      names: linked.names,
      ref: linked._id
    },
    assigned: {
      username: assigned.username,
      ref: assigned._id
    }
  }

  return data
}

const replacleContent = ({
  content,
  preheader,
  template,
  course,
  sale,
  linked,
  assigned
}) => {
  if (!template) {
    return {
      content,
      preheader
    }
  }

  template.variables.map(variable => {
    const model = variable.field.split('.')[0]
    const nameField = variable.field.split('.')[1]
    const regex = new RegExp(`{{${variable.name}}}`, 'gi')
    if (model === 'course' && course) {
      if (nameField === 'brochure') {
        const url = MEDIA_PATH + course[nameField]
        content = content.replace(
          regex,
          `<a href="${url}" target="_blank">${course.name}</a>`
        )
        preheader = preheader.replace(regex, url)
      } else {
        content = content.replace(regex, course[nameField])
        preheader = preheader.replace(regex, course[nameField])
      }
    }
    if (model === 'linked' && linked) {
      content = content.replace(regex, linked[nameField])
      preheader = preheader.replace(regex, linked[nameField])
    }
    if (model === 'assigned' && assigned) {
      content = content.replace(regex, assigned[nameField])
      preheader = preheader.replace(regex, assigned[nameField])
    }
    if (model === 'sale' && sale) {
      content = content.replace(regex, sale[nameField])
      preheader = preheader.replace(regex, sale[nameField])
    }
  })

  return { content, preheader }
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
  sendEmail(userEmail)
}

const updateStatusEmail = async ({ emailId, event }) => {
  console.log({ emailId, event })
  const email = await emailDB.detail({
    query: { _id: emailId },
    select: 'status'
  })
  const status = getNewStatus(event)
  console.log('email', email.status)
  console.log('status', status)
  if (email.status !== status) {
    console.log('change')
    const updateEmail = await emailDB.update(email._id, { status })
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
      return 'Interacción'
    case 'spamreport':
      return 'Spam'
    case 'bounce':
      return 'Rechazado'
    default:
      return event
  }
}

const emitEmail = email => {
  console.log('emit email')
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
