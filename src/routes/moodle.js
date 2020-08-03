'use strict'

const { Router } = require('express')
const Api = require('../controllers/moodle')

const router = new Router()

router.route('/moodle/user').post(Api.createUser)
router.route('/moodle/certificates').post(Api.createCertificates)
router.route('/migrations/course').post(Api.enrrollUser)

module.exports = router
