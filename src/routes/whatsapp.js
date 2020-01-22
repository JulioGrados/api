'use strict'

const { Router } = require('express')
const Api = require('../controllers/whatsapp')

const router = new Router()

router.route('/whatsapps')
  .get(Api.listWhatsapps)
  .post(Api.createWhatsapp)

router.route('/whatsapps/:id')
  .get(Api.detailWhatsapp)
  .put(Api.updateWhatsapp)
  .delete(Api.deleteWhatsapp)

module.exports = router
