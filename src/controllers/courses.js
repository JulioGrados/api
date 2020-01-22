'use strict'

const serviceCourse = require('../services/course')

const listCourses = async (req, res) => {
  const courses = await serviceCourse.listCourses(req.query)
  return res.status(200).json(courses)
}

const createCourse = async (req, res) => {
  try {
    const course = await serviceCourse.createCourse(req.body, req.course)
    return res.status(201).json(course)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const updateCourse = async (req, res) => {
  const courseId = req.params.id
  try {
    const course = await serviceCourse.updateCourse(courseId, req.body, req.course)
    return res.status(200).json(course)
  } catch (error) {
    return res.status(error.status).json(error)
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
    const course = await serviceCourse.detailCourse(params)
    return res.status(200).json(course)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

const deleteCourse = async (req, res) => {
  const courseId = req.params.id
  try {
    await serviceCourse.deleteCourse(courseId, req.course)
    return res.status(204).json()
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  listCourses,
  createCourse,
  updateCourse,
  detailCourse,
  deleteCourse
}
