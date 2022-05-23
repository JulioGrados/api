'use strict'

const { Router } = require('express')
const Api = require('../../controllers/leadgods')

const router = new Router()

router.route('/leadgods').get(Api.eventLeadgods)

module.exports = router