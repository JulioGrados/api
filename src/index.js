'use strict'

require('./lib/cron')

const server = require('./server')
const { connectIO } = require('./lib/io')
const config = require('config')
const { handleMessage } = require('utils').log

const filePath = 'api:src:index'

const main = async () => {
  const serverApp = await server.listen(config.server.port)
  connectIO(serverApp)
  handleMessage(`[Api Server] running in port ${config.server.port}`, filePath)
}

main()
