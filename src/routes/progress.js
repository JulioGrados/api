'use strict'

const { Router } = require('express')
const Api = require('../controllers/progresses')

const router = new Router()

router
  .route('/progresses')
  .get(Api.listProgresss)
  .post(Api.createProgress)

router
  .route('/progresses/:id')
  .get(Api.detailProgress)
  .put(Api.updateProgress)
  .delete(Api.deleteProgress)

module.exports = router
