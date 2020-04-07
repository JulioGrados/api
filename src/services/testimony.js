'use strict'

const { testimonyDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listTestimonies = async params => {
  const testimonies = await testimonyDB.list(params)
  return testimonies
}

const createTestimony = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/testimonies')
    body.image = route
  }
  const testimony = await testimonyDB.create(body)
  return testimony
}

const updateTestimony = async (testimonyId, body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/testimonies')
    body.image = route
  }
  const testimony = await testimonyDB.update(testimonyId, body)
  return testimony
}

const detailTestimony = async params => {
  const testimony = await testimonyDB.detail(params)
  return testimony
}

const deleteTestimony = async (testimonyId, loggedUser) => {
  const testimony = await testimonyDB.remove(testimonyId)
  return testimony
}

const countDocuments = async params => {
  const count = await testimonyDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listTestimonies,
  createTestimony,
  updateTestimony,
  detailTestimony,
  deleteTestimony
}
