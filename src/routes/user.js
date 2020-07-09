'use strict'

const { Router } = require('express')
const Api = require('../controllers/users')
const { isAdmin } = require('../auth/permissions')

const router = new Router()

router.route('/users/count').get(Api.countDocuments)

router
  .route('/users')
  .get(Api.listUsers)
  .post(Api.createUser)

router
  .route('/users/:id')
  .get(Api.detailUser)
  .put(Api.updateUser)
  .delete(isAdmin, Api.deleteUser)

module.exports = router
