'use strict'

const { Router } = require('express')
const Api = require('../../controllers/anura')

const router = new Router()

router.route('/anura').post(Api.eventWebhook)

module.exports = router
