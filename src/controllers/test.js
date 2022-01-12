'use strict'

const services = require('../services/test')

const getLessions = async (req, res, next) => {
  try {
    const lessions = await services.getLessions(req.body)
    return lessions
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getLessions
}