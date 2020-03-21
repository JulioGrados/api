'use strict'

const { Router } = require('express')
const Api = require('../controllers/migrations')
const { isAdmin } = require('../auth/permissions')

const router = new Router()

router.route('/migrations/teachers').post(isAdmin, Api.migrateTeachers)
router.route('/migrations/courses').post(isAdmin, Api.migrateCourses)
router
  .route('/migrations/courses/moodle')
  .post(isAdmin, Api.migrateMoodleCourses)

module.exports = router
