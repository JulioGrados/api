'use strict'

const { Router } = require('express')
const Api = require('../../controllers/users')

const router = new Router()

router.route('/teachers').get(Api.listTeachers)
router.route('/users').post(Api.createOrUpdateUser)

module.exports = router
