'use strict'

const { emailDB } = require('../db')
const { sendEmail } = require('utils/lib/sendgrid')

const listEmails = async params => {
  const emails = await emailDB.list(params)
  return emails
}

const createEmail = async (body, loggedUser) => {
  console.log(body)
  const dataEmail = prepareEmail(body)
  const email = await emailDB.create(dataEmail)
  sendEmailSengrid(email)
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

const prepareEmail = ({ linked, assigned, template, from, ...args }) => {
  const { content, preheader } = replacleContent({
    ...args,
    linked,
    template,
    assigned
  })

  const data = {
    content,
    preheader,
    from,
    to: linked.email,
    sender: template.sender,
    template: {
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
  template.variables.map(variable => {
    const model = variable.field.split('.')[0]
    const nameField = variable.field.split('.')[1]
    const regex = new RegExp(`{${variable.name}}`, 'gi')
    if (model === 'course' && course) {
      content = content.replace(regex, course[nameField])
      preheader = preheader.replace(regex, course[nameField])
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

module.exports = {
  countDocuments,
  listEmails,
  createEmail,
  updateEmail,
  detailEmail,
  deleteEmail
}
