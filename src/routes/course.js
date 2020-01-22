'use strict'

const { Router } = require('express')
const Api = require('../controllers/couses')

const router = new Router()

router.route('/courses')
  .get(Api.listCourses)
  .post(Api.createCourse)

router.route('/courses/:id')
  .get(Api.detailCourse)
  .put(Api.updateCourse)
  .delete(Api.deleteCourse)

module.exports = router
