'use strict'

const { Router } = require('express')
const Api = require('../../controllers/agreement')

const router = new Router()

router.route('/agreements').get(Api.listAgreements)

module.exports = router
