'use strict'

const routesAuth = require('./auth')

module.exports = (server) => {
  server.use('/api/open', routesAuth)
}
