'use strict'

const service = require('../services/contact')

const listContacts = async (req, res) => {
  const contacts = await service.listContacts(req.query)
  return res.status(200).json(contacts)
}

const createContact = async (req, res) => {
  try {
    const contact = await service.createContact(req.body, req.contact)
    return res.status(201).json(contact)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateContact = async (req, res) => {
  const contactId = req.params.id
  try {
    const contact = await service.updateContact(
      contactId,
      req.body,
      req.contact
    )
    return res.status(200).json(contact)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailContact = async (req, res) => {
  const contactId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = contactId
  } else {
    params.query = {
      _id: contactId
    }
  }

  try {
    const contact = await service.detailContact(params)
    return res.status(200).json(contact)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteContact = async (req, res) => {
  const contactId = req.params.id
  try {
    const contact = await service.deleteContact(contactId, req.contact)
    return res.status(201).json(contact)
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
  listContacts,
  createContact,
  updateContact,
  detailContact,
  deleteContact
}
