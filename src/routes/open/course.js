'use strict'

const { Router } = require('express')
const Api = require('../../controllers/courses')

const router = new Router()

router.route('/courses').get(Api.listOpenCourses)
router.route('/courses/count').get(Api.countDocuments)

module.exports = router
