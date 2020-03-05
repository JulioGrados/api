'use strict'

const routesAuth = require('./auth')
const routesUser = require('./user')
const routesCourse = require('./course')
const routesContact = require('./contact')
const routesSendgrid = require('./sendgrid')
const routesCategory = require('./category')
const routesAgrement = require('./agreement')

module.exports = server => {
  server.use('/api/open', routesAuth)
  server.use('/api/open', routesUser)
  server.use('/api/open', routesCourse)
  server.use('/api/open', routesContact)
  server.use('/api/open', routesSendgrid)
  server.use('/api/open', routesCategory)
  server.use('/api/open', routesAgrement)
}
