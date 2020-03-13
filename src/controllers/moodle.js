'use strict'
const moodle_client = require('moodle-client')

const { connectionMoodle } = require('utils/lib/moodle')
//core_user_create_users
//SELECT * FROM mdl_course where fullname = course.name
// const userMoodle = {
//   username: 'abc1',
//   password: '123',
//   firstname: 'abc',
//   lastname: 'abc',
//   email: 'abc1@gmail.com',
//   idnumber: '4928'
// }

// const enroll = {
//   roleid: '5',
//   userid: '4927',
//   courseid: '3'
// }
// const init = moodle_client.init({
//   wwwroot: 'https://cursos.eai.edu.pe',
//   token: 'ca27f68d60ff203731882a141e2da38b',
//   service: 'from_wordpress'
// })

// init.then(function (client) {
//   return client
//     .call({
//       wsfunction: 'enrol_manual_enrol_users',
//       method: 'POST',
//       args: {
//         enrolments: [enroll]
//       }
//     })
//     .then(function (info) {
//       console.log(info)
//       return
//     })
//     .catch(function (err) {
//       console.log(err)
//     })
// })
const createUser = async (req, res) => {
  try {
    const pool = await connectionMoodle()
    console.log('pool', pool)
    let result1 = await pool
      .request()
      .input('input_parameter', sql.Int, value)
      .query('select * from mdl_course')

    console.dir(result1)
  } catch (err) {
    console.log(err)
  }
  res.send('hola')
}

module.exports = {
  createUser
}
