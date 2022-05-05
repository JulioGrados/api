'use strict'

const { Router } = require('express')
const Api = require('../../controllers/zadarma')

const router = new Router()

router.route('/zadarma').get(Api.eventWebHookZadarma)

module.exports = router