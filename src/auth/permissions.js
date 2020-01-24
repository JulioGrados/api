'use strict'

const isAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'admin') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de admin.'
    })
}

const isTeacher = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'teacher') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de profesor.'
    })
}

const isCompany = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'compay') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de empresa.'
    })
}

const isClient = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'client') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de cliente.'
    })
}

const isAssessor = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'assessor') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de Asesor.'
    })
}

const isColaborator = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'collaborator') {
      return next()
    }
  }
  res
    .status(401)
    .json({
      success: false,
      message: 'No tienes autorización de Colaborador.'
    })
}

module.exports = {
  isAdmin,
  isTeacher,
  isCompany,
  isClient,
  isAssessor,
  isColaborator
}
