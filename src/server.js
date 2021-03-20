'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const cors = require('cors')
const morgan = require('morgan')
const config = require('config')

const routes = require('./routes')
const routesOpen = require('./routes/open')

const { authHandler } = require('./auth')

const server = express()

server.use(
  fileUpload({
    createParentPath: true
  })
)

server.use(
  bodyParser.json({
    limit: '50mb',
    extended: true
  })
)

server.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 500000
  })
)

const corsOpts = {
  origin: 'http://*.eai.edu.pe/',

  methods: ['GET', 'POST'],

  allowedHeaders: ['Content-Type'],

  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

server.use(morgan('dev'))
server.use(cors(corsOpts))

routesOpen(server)
server.use(authHandler)
routes(server)

if (config.server.env === 'production') {
  server.use(Sentry.Handlers.errorHandler())
}

module.exports = server
