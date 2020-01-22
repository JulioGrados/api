'use strict'

const { Router } = require('express')
const Api = require('../controllers/sale')

const router = new Router()

router.route('/sales')
  .get(Api.listSales)
  .post(Api.createSales)

router.route('/sales/:id')
  .get(Api.detailSale)
  .put(Api.updateSale)
  .delete(Api.deleteSale)

module.exports = router
