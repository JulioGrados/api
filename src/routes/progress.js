'use strict'

const { Router } = require('express')
const Api = require('../controllers/progresss')

const router = new Router()

router.route('/progresss')
  .get(Api.listProgresss)
  .post(Api.createProgress)

router.route('/progresss/:id')
  .get(Api.detailProgress)
  .put(Api.updateProgress)
  .delete(Api.deleteProgress)

module.exports = router
