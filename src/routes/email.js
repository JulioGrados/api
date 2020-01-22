'use strict'

const { Router } = require('express')
const Api = require('../controllers/emails')

const router = new Router()

router.route('/emails')
  .get(Api.listEmails)
  .post(Api.createEmail)

router.route('/emails/:id')
  .get(Api.detailEmail)
  .put(Api.updateEmail)
  .delete(Api.deleteEmail)

module.exports = router
