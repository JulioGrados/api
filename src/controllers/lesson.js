'use strict'

const service = require('../services/lesson')

const listLessons = async (req, res) => {
  const lessons = await service.listLessons(req.query)
  return res.status(200).json(lessons)
}

const createLesson = async (req, res) => {
  try {
    const lesson = await service.createLesson(req.body, req.user)
    return res.status(201).json(lesson)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateLesson = async (req, res) => {
  const lessonId = req.params.id
  try {
    const lesson = await service.updateLesson(lessonId, req.body, req.user)
    return res.status(200).json(lesson)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailLesson = async (req, res) => {
  const lessonId = req.params.id
  const params = req.query
  if (lessonId) {
    if (params.query) {
      params.query._id = lessonId
    } else {
      params.query = {
        _id: lessonId
      }
    }
  }

  try {
    const lesson = await service.detailLesson(params)
    return res.status(200).json(lesson)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteLesson = async (req, res) => {
  const lessonId = req.params.id
  try {
    const lesson = await service.deleteLesson(lessonId, req.user)
    return res.status(201).json(lesson)
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
  listLessons,
  createLesson,
  updateLesson,
  detailLesson,
  deleteLesson
}
