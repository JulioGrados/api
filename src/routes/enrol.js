'use strict'

const { Router } = require('express')
const Api = require('../controllers/enrols')

const router = new Router()

router.route('/enrols/count').get(Api.countDocuments)

router
  .route('/enrols')
  .get(Api.listEnrols)
  .post(Api.createEnrol)

router
  .route('/enrols/:id')
  .get(Api.detailEnrol)
  .put(Api.updateEnrol)
  .delete(Api.deleteEnrol)

module.exports = router
