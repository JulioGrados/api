'use strict'

const { Router } = require('express')
const Api = require('../controllers/deals')

const router = new Router()

router.route('/deals/count').get(Api.countDocuments)
router.route('/deal/enrol').post(Api.enrolDeal)

router
  .route('/deals')
  .get(Api.listDeals)
  .post(Api.createDeal)

router
  .route('/deals/search')
  .get(Api.searchDeals)

router
  .route('/deals/admin/:id')
  .put(Api.updateDealOne)

router
  .route('/deals/:id')
  .get(Api.detailDeal)
  .put(Api.updateDeal)
  .delete(Api.deleteDeal)

module.exports = router
