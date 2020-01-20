'use strict'

const server = require('./server')
const config = require('config')
const debug = require('debug')
const chalk = require('chalk')

const menssage = debug('api:src:index')

const main = async () => {
  await server.listen(config.server.port)
  console.log(`${config.server.port}`)
  menssage(`${chalk.green('[Api Server]')} running in port ${chalk.green(config.server.port)}`)
}

main()
