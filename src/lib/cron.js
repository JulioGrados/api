const CronJob = require('cron').CronJob
const path = require('path')

// const { readFile } = require('utils/files/read')
const { getDelayCalls } = require('../services/call')

const { createUserCertificate,
        gradesCron,
        enrolCron,
        certificateCron} = require('../services/moodle')

const job = new CronJob(
  '0 */8 9-19 * * *',
  getDelayCalls,
  null,
  true,
  'America/Bogota'
)

job.start()

// __dirname, '../uploads'
// const certificate = new CronJob('32 * * * *', async function() {
//   console.log('You will see this message every minuto');
//   const dir = path.resolve(__dirname, '../../backup/data.json')
//   const arr = await readFile(dir)
//   const users = await createUserCertificate(arr)
//   const grades = await gradesCron(arr)
//   const enrols = grades && await enrolCron(grades)
//   const certi = enrols && enrols.validEnrols && await certificateCron(enrols.validEnrols)
//   console.log('users', users)
//   console.log('grades', grades)
//   console.log('enrols', enrols)
//   enrols && enrols.validEnrols && console.log('certi', certi)
// }, null, true, 'America/Lima');
// certificate.start();

module.exports = {
  job
}

//0 0 * * 0 /usr/bin/mysqldump -u root --databases manvicio_ertmdl > /var/backups/moodle/moodle-"$(date +"%m-%d-%Y %H-%M")".sql
//16 25 4 3 *  /usr/bin/mysql -u root --databases manvicio_ertmdl
// 1 * * * * /usr/bin/php7.4  /var/www/moodle/admin/cli/cron.php
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', u.id, 'username', u.username, 'firstname', u.firstname, 'lastname', u.lastname, 'email', u.email, 'country', u.country, 'city', u.city, 'courseid', c.id, 'date', IF(cc.timecompleted=0,'',DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')), 'completed', IF((cc.timecompleted=0 OR cc.timecompleted IS NULL), IF(cc.timestarted=0,'Not started','Not complete'), 'Complete'))) AS 'json' FROM (mdl_user AS u INNER JOIN (mdl_course AS c INNER JOIN mdl_course_completions AS cc ON c.ID = cc.course) ON u.ID = cc.userid) INNER JOIN mdl_course_categories AS ccat ON ccat.id = c.category  WHERE cc.timecompleted != 0  AND cc.timecompleted IS NOT NULL AND DATE_FORMAT(FROM_UNIXTIME(cc.timecompleted), '%e/%c/%Y')='2/4/2021'" > /var/backups/moodle/data.json
//* * * * * /usr/bin/mysql -u root --database manvicio_ertmdl --execute="SELECT json_arrayagg(json_object('id', id)) from mdl_course" > /var/backups/moodle/course.json
//* * * * * /usr/local/bin/consult.sh 