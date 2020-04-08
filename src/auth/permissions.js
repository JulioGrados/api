'use strict'

const isAdmin = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Administrador') {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de administrador.'
  })
}

const isTeacher = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Docente') {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de docente.'
  })
}

const isCompany = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Compañia') {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de empresa.'
  })
}

const isClient = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Cliente') {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de cliente.'
  })
}

const isAssessor = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Asesor') {
      return next()
    }
  }
  return res.status(401).json({
    success: false,
    message: 'No tienes autorización de Asesor.'
  })
}

const isColaborator = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'Colaborador') {
      return next()
    }
  }
  return res.status(401).json({
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
