'use strict'

const { Router } = require('express')
const Api = require('../../services/moodle')

const router = new Router()

router.route('/moodle').get(Api.getUsersForField)

module.exports = router
