const service = require('../services/migration')
const csv = require('@fast-csv/parse')

const migrateTeachers = async (req, res) => {
  const data = JSON.parse(req.files.data.data.toString())
  try {
    const teachers = await service.migrateTeachers(data)
    return res.status(200).json(teachers)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateCourses = async (req, res) => {
  req.setTimeout(0)
  const dataCourses = JSON.parse(req.files.courses.data.toString())
  const dataTeachers = JSON.parse(req.files.teachers.data.toString())
  const dataAgreements = JSON.parse(req.files.agreements.data.toString())
  const dataBrochure = await csv2json(req.files.csv.data)
  try {
    const response = await service.migrateCourses(
      dataCourses,
      dataTeachers,
      dataBrochure,
      dataAgreements
    )
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const migrateMoodleCourses = async (req, res) => {
  req.setTimeout(0)
  const dataCourses = JSON.parse(req.files.courses.data.toString())
  const dataUsers = await csv2json(req.files.users.data)

  try {
    const response = await service.migrateMoodleCourses(dataCourses, dataUsers)
    return res.status(200).json(response)
  } catch (error) {
    console.log('error', error)
    return res.status(error.status || 500).json(error)
  }
}

const csv2json = async buffer =>
  new Promise(resolve => {
    console.log(buffer)
    const results = []

    csv
      .parseString(buffer, { headers: true })
      .on('data', data => {
        results.push(data)
      })
      .on('end', () => {
        return resolve(results)
      })
      .on('error', error => {
        console.log('error', error)
      })
  })

module.exports = {
  migrateTeachers,
  migrateCourses,
  migrateMoodleCourses
}
