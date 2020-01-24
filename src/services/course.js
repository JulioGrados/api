'use strict'

const { courseDB } = require('../db')

const listCourses = async (params) => {
  const courses = await courseDB.list(params)
  return courses
}

const createCourse = async (body, loggedCourse) => {
  const course = await courseDB.create(body)
  return course
}

const updateCourse = async (courseId, body, loggedCourse) => {
  const course = await courseDB.update(courseId, body)
  return course
}

const detailCourse = async (params) => {
  const course = await courseDB.detail(params)
  return course
}

const deleteCourse = async (courseId, loggedCourse) => {
  const course = await courseDB.remove(courseId)
  return course
}

module.exports = {
  listCourses,
  createCourse,
  updateCourse,
  detailCourse,
  deleteCourse
}
