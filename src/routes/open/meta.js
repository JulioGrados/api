'use strict'

const { Router } = require('express')
const Api = require('../../controllers/metas')

const router = new Router()

router.route('/metas').get(Api.listMetas)

module.exports = router
