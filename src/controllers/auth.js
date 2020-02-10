'use strict'

const authServices = require('../services/auth')

const loginUser = async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await authServices.loginUser(username, password)
    return res.status(200).json(user)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  loginUser
}
