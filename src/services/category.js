'use strict'

const { categoryDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listCategories = async params => {
  const categories = await categoryDB.list(params)
  return categories
}

const createCategory = async (body, file, loggedUser) => {
  const route = await saveFile(file, '/categories/' + file.name)
  console.log('respuesta', route)
  body.image = route
  const category = await categoryDB.create(body)
  return category
}

const updateCategory = async (categoryId, body, loggedUser) => {
  const category = await categoryDB.update(categoryId, body)
  return category
}

const detailCategory = async params => {
  const category = await categoryDB.detail(params)
  return category
}

const deleteCategory = async (categoryId, loggedUser) => {
  const category = await categoryDB.remove(categoryId)
  return category
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  detailCategory,
  deleteCategory
}
