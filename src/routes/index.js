'use strict'

const routesUser = require('./user')

module.exports = (server) => {
  server.use('/api', routesUser)
}
