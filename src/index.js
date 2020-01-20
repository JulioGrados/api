'use strict'

const server = require('./server')
const config = require('config')
const { handleMessage } = require('utils').log

const filePath = 'api:src:index'

const main = async () => {
  await server.listen(config.server.port)
  handleMessage(`[Api Server] running in port ${config.server.port}`, filePath)
}

main()
