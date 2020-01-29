'use strict'

const serviceCategory = require('../services/category')

const listCategories = async (req, res) => {
  const categories = await serviceCategory.listCategories(req.query)
  return res.status(200).json(categories)
}

const createCategory = async (req, res) => {
  try {
    const category = await serviceCategory.createCategory(req.body, req.user)
    return res.status(201).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateCategory = async (req, res) => {
  const categoryId = req.params.id
  try {
    const category = await serviceCategory.updateCategory(categoryId, req.body, req.user)
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
    const category = await serviceCategory.detailCategory(params)
    return res.status(200).json(category)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteCategory = async (req, res) => {
  const categoryId = req.params.id
  try {
    await serviceCategory.deleteCategory(categoryId, req.user)
    return res.status(201).json()
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
