'use strict'

const { Router } = require('express')
const Api = require('../../controllers/certificates')

const router = new Router()

router.route('/certificate/detail').post(Api.detailCertificate)

module.exports = router
