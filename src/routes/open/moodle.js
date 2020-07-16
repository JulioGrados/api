'use strict'

const { Router } = require('express')
const Api = require('../../controllers/moodle')

const router = new Router()

router.route('/moodle').get(Api.gradeUser)

module.exports = router
