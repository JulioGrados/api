'use strict'

const db = require('db')
const config = require('config')

const connection = db(config.db)

module.exports = connection
