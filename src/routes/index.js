'use strict'

const routesUser = require('./user')
const routesWhatsapp = require('./whatsapp')
const routesReceipt = require('./receipt')
const routesSale = require('./sale')
const routesAgreement = require('./agreement')


module.exports = (server) => {
  server.use('/api', routesUser)
  server.use('/api', routesWhatsapp)
  server.use('/api', routesReceipt)
  server.use('/api', routesSale)
  server.use('/api', routesAgreement)
}
