'use strict'

const { Router } = require('express')
const Api = require('../../controllers/users')

const router = new Router()

router.route('/teachers').get(Api.listTeachers)
router.route('/users').post(Api.createOrUpdateUser)
router.route('/users/count').get(Api.countDocuments)
router.route('/users/recover').post(Api.recoverPassword)

module.exports = router
