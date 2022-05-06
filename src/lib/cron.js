const CronJob = require('cron').CronJob
const path = require('path')

const { readFile } = require('utils/files/read')
const { getDelayCalls } = require('../services/call')

const {
  createUserCertificate,
  createEnrolID,
  gradesCron,
  enrolCron,
  certificateCron,
  createPdfStudent,
  sendEmailStudent,
  deleteFilesPdf,
  scoreStudentsCron,
  scoreStudentsOnlyCron,
  examInModules
} = require('../services/moodle')

const { createAddressEnrol } = require('../services/enrol')
const { portfolioFile } = require('utils/functions/portfolio')
const { countDocuments, listCourses, detailCourse } = require('../services/course')
const { saveTokenZadarma } = require('../services/user')

const job = new CronJob(
  '0 0 7 * * *',
  getDelayCalls,
  null,
  true,
  'America/Bogota'
)
job.start()

// const scoremasone = new CronJob('0 0 23 * * *', async function() {
//   console.log('You will see this message every minuto')
//   const course = await detailCourse({ query: { moodleId: 89 }})
//   const score = await scoreStudentsOnlyCron(course)
//   console.log('score', score)
// }, null, true, 'America/Bogota')
// scoremasone.start()

const scoreone = new CronJob('0 0 2 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(0, count)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoreone.start()

const scoretwo = new CronJob('0 20 2 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count, count*2)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoretwo.start()

const scorethree = new CronJob('0 40 2 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*2, count*3)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scorethree.start()

const scorefour = new CronJob('0 0 3 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*3, count*4)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scorefour.start()

const scorefive = new CronJob('0 20 3 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*4, count*5)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scorefive.start()

const scoresix = new CronJob('0 40 3 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*5, count*6)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoresix.start()

const scoreseven = new CronJob('0 0 4 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*6, count*7)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoreseven.start()

const scoreseight = new CronJob('0 20 4 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*7, count*8)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoreseight.start()

const scoresnine = new CronJob('0 40 4 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*8, count*9)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoresnine.start()

const scoresten = new CronJob('0 0 5 * * *', async function() {
  console.log('You will see this message every minuto')
  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 10)
  const arrCourse = courses.slice(count*9, coursesCount)
  const filterCourse = arrCourse.filter(item => item.moodleId && item.moodleId !== 89 && item.moodleId !== 7 && item.moodleId !== 174 )
  const scores = await scoreStudentsCron(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
scoresten.start()

// 0 40 5
const certificate = new CronJob('0 40 5 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const users = await createUserCertificate(arr)
  const grades = await gradesCron(arr)
  const enrols = grades && await enrolCron(grades)
  const certi = enrols && enrols.validEnrols && await certificateCron(enrols.validEnrols)
  const filterArr = arr.filter(element => element.courseid == '89' || element.courseid == '174')
  const emails = enrols && enrols.validEnrols && certi && await createPdfStudent(filterArr)
  console.log('users', users)
  console.log('grades', grades)
  console.log('enrols', enrols)
  enrols && enrols.validEnrols && console.log('certi', certi)
  console.log('emails', emails)
}, null, true, 'America/Bogota');
certificate.start();

const files = new CronJob('0 50 5 * * *', async function() {
  console.log('You will see this message every minuto');
  const files = await portfolioFile('/certificates/free/')
  const filterFiles = files.filter(file => file.includes('.pdf'))
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const filterArr = arr.filter(element => element.courseid == '89' || element.courseid == '174')
  console.log('filterFiles', filterFiles)
  console.log('filterArr', filterArr)
  const send = await sendEmailStudent(filterFiles, filterArr)
}, null, true, 'America/Bogota');
files.start();

const deletes = new CronJob('0 0 6 * * *', async function() {
  console.log('You will see this message every minuto');
  const files = await portfolioFile('/certificates/free/')
  const filterFiles = files.filter(file => file.includes('.pdf'))
  const send = await deleteFilesPdf(filterFiles)
}, null, true, 'America/Bogota');
deletes.start();

const zadarma = new CronJob('0 16 10 * * *', async function() {
  console.log('You will see this message every minuto');
  const usersZadarma = await saveTokenZadarma()
  console.log('usersZadarma', usersZadarma)
}, null, true, 'America/Bogota');
zadarma.start();

const enrol = new CronJob('0 0 19 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/enrol.json')
  const arr = await readFile(dir)
  const enrols = await createEnrolID(arr)
  console.log('enrols', enrols)
}, null, true, 'America/Bogota');
enrol.start();

const address = new CronJob('0 10 6 * * *', async function() {
  console.log('You will see this message every minuto');
  const dir = path.resolve(__dirname, '../../backup/data.json')
  const arr = await readFile(dir)
  const enrols = await createAddressEnrol(arr)
  console.log('enrols', enrols)
}, null, true, 'America/Bogota');
address.start();

const examinmodulesone = new CronJob('0 0 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(0, count)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesone.start()

const examinmodulestwo = new CronJob('0 12 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count, count*2)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulestwo.start()

const examinmodulesthree = new CronJob('0 24 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*2, count*3)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesthree.start()

const examinmodulesfour = new CronJob('0 36 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*3, count*4)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesfour.start()

const examinmodulesfive = new CronJob('0 48 23 * * *', async function() {
  console.log('You will see this message every minuto')

  const coursesCount = await countDocuments({ query: {} })
  const courses = await listCourses({ query: {}, sort: 'name' })
  const count = parseInt(coursesCount / 5)
  const arrCourse = courses.slice(count*4, coursesCount)
  const filterCourse = arrCourse.filter(item => item.moodleId)
  const scores = await examInModules(filterCourse)
  console.log('scores', scores)
}, null, true, 'America/Bogota')
examinmodulesfive.start()

module.exports = {
  job,
  enrol,
  zadarma,
  certificate,
  address,
  files
}

//0 0 * * 0 /usr/bin/mysqldump -u root --databases manvicio_ertmdl > /var/backups/moodle/moodle-"$(date +"%m-%d-%Y %H-%M")".sql
//16 25 4 3 *  /usr/bin/mysql -u root --databases manvicio_ertmdl
// 1 * * * * /usr/bin/php7.4  /var/www/moodle/admin/cli/cron.php
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', u.id, 'username', u.username, 'firstname', u.firstname, 'lastname', u.lastname, 'email', u.email, 'country', u.country, 'city', u.city, 'courseid', c.id, 'date', IF(cc.timecompleted=0,'',DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')), 'completed', IF((cc.timecompleted=0 OR cc.timecompleted IS NULL), IF(cc.timestarted=0,'Not started','Not complete'), 'Complete'))) AS 'json' FROM (mdl_user AS u INNER JOIN (mdl_course AS c INNER JOIN mdl_course_completions AS cc ON c.ID = cc.course) ON u.ID = cc.userid) INNER JOIN mdl_course_categories AS ccat ON ccat.id = c.category  WHERE cc.timecompleted != 0  AND cc.timecompleted IS NOT NULL AND DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')='2/4/2021'" > /var/backups/moodle/data.json
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', id)) from mdl_course" > /var/backups/moodle/course.json
//* * * * * /usr/local/bin/consult.sh 