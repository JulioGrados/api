'use strict'

const { Router } = require('express')
const Api = require('../controllers/users')

const router = new Router()

router.route('/users')
  .get(Api.listUsers)
  .post(Api.createUser)

router.route('/users/:id')
  .get(Api.detailUser)
  .put(Api.updateUser)
  .delete(Api.deleteUser)

module.exports = router
