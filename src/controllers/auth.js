'use strict'

const authServices = require('../services/auth')

const loginUser = async (req, res) => {
  try {
    const user = await authServices.loginUser(req.body.username, req.body.password)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(error.status).json(error)
  }
}

module.exports = {
  loginUser
}
