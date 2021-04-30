'use strict'

const { courseDB, dealDB, userDB } = require('../db')
const { saveFile } = require('utils/files/save')

const listCourses = async params => {
  const courses = await courseDB.list(params)
  return courses
}

const createCourse = async (body, files, loggedCourse) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const course = await courseDB.create(body)
  return course
}

const updateCourse = async (courseId, body, files, loggedCourse) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/courses')
      body[label] = route
    }
  }
  const course = await courseDB.update(courseId, body)
  return course
}

const updateDealCreate = async (dealId, body, loggedUser) => {
  // console.log('dealId', dealId)
  // console.log('body', body)
  let deal = await dealDB.detail({
    query: { _id: dealId },
    populate: { path: 'client' }
  })
  const userId = deal.client._id
  // const courseId = deal.students[0].courses[0] && deal.students[0].courses[0]._id
  const courseId = "sistema-de-gestion-de-la-calidad"
  const course = await courseDB.detail({
    query: { slug: courseId }
  })

  const user = await userDB.detail({
    query: { _id: userId }
  })

  
  const students = [
      {
        student: {...user, ref: user},
        courses: {...course.toJSON(), ref: course.toJSON()}
      }
    ]

  // deal.students[0].courses[0] = {...course.toJSON(), ref: course.toJSON()}
  // deal.students[0].student = {...user.toJSON(), ref: user.toJSON()}
  const updateDeal = await dealDB.update(dealId, {students: students})
  
  return updateDeal
}

const detailCourse = async params => {
  const course = await courseDB.detail(params)
  return course
}

const deleteCourse = async (courseId, loggedCourse) => {
  const course = await courseDB.remove(courseId)
  return course
}

const countDocuments = async params => {
  const count = await courseDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCourses,
  createCourse,
  updateCourse,
  updateDealCreate,
  detailCourse,
  deleteCourse
}
