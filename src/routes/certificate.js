'use strict'

const { Router } = require('express')
const Api = require('../controllers/certificates')

const router = new Router()

router.route('/certificates/count').get(Api.countDocuments)

router
  .route('/certificates')
  .get(Api.listCertificates)
  .post(Api.createCertificate)

router
  .route('/certificates/:id')
  .get(Api.detailCertificate)
  .put(Api.updateCertificate)
  .delete(Api.deleteCertificate)

module.exports = router
