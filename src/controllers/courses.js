'use strict'

const service = require('../services/course')

const listCourses = async (req, res) => {
  const courses = await service.listCourses(req.query)
  return res.status(200).json(courses)
}

const createCourse = async (req, res) => {
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const course = await service.createCourse(body, files, req.user)
    return res.status(201).json(course)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateCourse = async (req, res) => {
  const courseId = req.params.id
  const body = JSON.parse(req.body.data)
  const files = req.files
  try {
    const course = await service.updateCourse(courseId, body, files, req.user)
    return res.status(200).json(course)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailCourse = async (req, res) => {
  const courseId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = courseId
  } else {
    params.query = {
      _id: courseId
    }
  }

  try {
    const course = await service.detailCourse(params)
    return res.status(200).json(course)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteCourse = async (req, res) => {
  const courseId = req.params.id
  try {
    const course = await service.deleteCourse(courseId, req.user)
    return res.status(201).json(course)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const listOpenCourses = async (req, res) => {
  const params = {
    ...req.query,
    select: req.query.select
      ? req.query.select.replace('clases', '')
      : { clases: 0 }
  }
  const courses = await service.listCourses(params)
  return res.status(200).json(courses)
}

module.exports = {
  listCourses,
  createCourse,
  updateCourse,
  detailCourse,
  deleteCourse,
  listOpenCourses
}
