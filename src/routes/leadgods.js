'use strict'

const { Router } = require('express')
const Api = require('../controllers/leadgods')

const router = new Router()

router.route('/leadgods/count').get(Api.countDocuments)

router
  .route('/leadgods')
  .get(Api.listLeadgods)
  .post(Api.createLeadgods)

router
  .route('/leadgods/:id')
  .get(Api.detailLeadgods)
  .delete(Api.deleteLeadgods)

module.exports = router
