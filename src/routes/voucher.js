'use strict'

const { Router } = require('express')
const Api = require('../controllers/vouchers')

const router = new Router()

router.route('/vouchers')
  .get(Api.listVouchers)
  .post(Api.createVoucher)

router.route('/vouchers/:id')
  .get(Api.detailVoucher)
  .put(Api.updateVoucher)
  .delete(Api.deleteVoucher)

module.exports = router
