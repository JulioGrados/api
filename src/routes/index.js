'use strict'

const routesLog = require('./log')
const routesUser = require('./user')
const routesVoucher = require('./voucher')
const routesCategory = require('./category')
const routesTemplate = require('./template')

module.exports = (server) => {
  server.use('/api', routesLog)
  server.use('/api', routesUser)
  server.use('/api', routesVoucher)
  server.use('/api', routesCategory)
  server.use('/api', routesTemplate)
}
