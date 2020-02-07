'use strict'

const service = require('../services/category')

const listCategories = async (req, res) => {
  const categories = await service.listCategories(req.query)
  return res.status(200).json(categories)
}

const createCategory = async (req, res) => {
  try {
    const body = JSON.parse(req.body.data)
    const file = req.files && req.files.image
    const category = await service.createCategory(body, file, req.user)
    return res.status(201).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateCategory = async (req, res) => {
  const categoryId = req.params.id
  const body = JSON.parse(req.body.data)
  const file = req.files && req.files.image
  try {
    const category = await service.updateCategory(
      categoryId,
      body,
      file,
      req.user
    )
    return res.status(200).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const detailCategory = async (req, res) => {
  const categoryId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = categoryId
  } else {
    params.query = {
      _id: categoryId
    }
  }

  try {
    const category = await service.detailCategory(params)
    return res.status(200).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteCategory = async (req, res) => {
  const categoryId = req.params.id
  try {
    const category = await service.deleteCategory(categoryId, req.user)
    return res.status(201).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  detailCategory,
  deleteCategory
}
