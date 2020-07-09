'use strict'

const { Router } = require('express')
const Api = require('../controllers/receipt')

const router = new Router()

router.route('/receipts/count').get(Api.countDocuments)

router
  .route('/receipts')
  .get(Api.listReceipts)
  .post(Api.createReceipt)

router
  .route('/receipts/:id')
  .get(Api.detailReceipt)
  .put(Api.updateReceipt)
  .delete(Api.deleteReceipt)

module.exports = router
