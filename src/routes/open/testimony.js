'use strict'

const { Router } = require('express')
const Api = require('../../controllers/testimonies')

const router = new Router()

router.route('/testimonies').get(Api.listTestimonies)

module.exports = router
