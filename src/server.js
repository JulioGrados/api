'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')

const routes = require('./routes')
const routesOpen = require('./routes/open')

const authHandler = require('./auth')

const server = express()

server.use(bodyParser.json({
  limit: '50mb',
  extended: true
}))

server.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 500000
}))

server.use(morgan('dev'))
server.use(cors())

routesOpen(server)
server.use(authHandler)
routes(server)

module.exports = server
