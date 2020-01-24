'use strict'

const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcrypt')

const { userDB } = require('../db')

const loginUser = async (username, password) => {
  if (!username || !password) {
    const error = {
      status: 400,
      message: 'Necesitas un username y una contraseña.'
    }
    throw error
  }

  const selectedFields = 'username personalInfo firstName lastName password role'

  let user = null

  try {
    user = await userDB.detail({
      query: {
        username
      },
      select: selectedFields
    })
  } catch (error) {
    throw error
  }

  if (!user) {
    const error = {
      status: 401,
      message: 'El usuario no existe.'
    }

    throw error
  }

  const passCorrect = bcrypt.compareSync(password, user.password)
  if (!passCorrect) {
    const error = {
      status: 401,
      message: 'Los datos de acceso son incorrectos.'
    }
    throw error
  }

  const token = jwt.sign(user.toJSON(), config.auth.secret, {
    expiresIn: '1d'
  })

  const respuesta = {
    token,
    user
  }

  return respuesta
}

module.exports = {
  loginUser
}
  
