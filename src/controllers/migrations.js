const service = require('../services/migration')

const migrateTeachers = async (req, res) => {
  const data = JSON.parse(req.body.data)
  try {
    const teachers = await service.migrateTeachers(data)
    return res.status(200).json(teachers)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateCourses = async (req, res) => {
  const data = JSON.parse(req.body.data)
  try {
    const response = await service.migrateCourses(data)
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  migrateTeachers,
  migrateCourses
}
