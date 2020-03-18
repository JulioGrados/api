'use strict'

const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const { userDB, courseDB } = require('../db')

const init = moodle_client.init({
  wwwroot,
  token,
  service
})

const {
  getCourses,
  enrolCourse,
  createUser
} = require('config').moodle.functions

const actionMoodle = (method, wsfunction, args = {}) => {
  return init.then(function (client) {
    console.log({ method, wsfunction, args })
    return client
      .call({
        wsfunction,
        method,
        args
      })
      .then(function (info) {
        return info
      })
      .catch(function (err) {
        throw err
      })
  })
}

const createNewUser = async user => {
  const dataUser = {
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
    username: user.username,
    password: 'escuelaamericanadeinnovacion'
  }
  console.log('dataUser', dataUser)
  const userMoodle = await actionMoodle('POST', createUser, {
    users: [dataUser]
  })

  console.log('userMoodle', userMoodle[0])
  if (userMoodle && userMoodle.length) {
    await userDB.update(user._id, { moodleId: userMoodle[0].id })
  } else {
    const error = {
      status: 500,
      message: 'No se pudo crear el usuario de Moodle'
    }
    throw error
  }
  return userMoodle[0]
}

const findMoodleCourse = async course => {
  const courses = await actionMoodle('GET', getCourses)
  const courseEnroll = courses.filter(item => item.fullname === course.name)
  console.log('courseEnroll search', courseEnroll)
  if (!courseEnroll) {
    const error = {
      status: 404,
      message: 'No se encontro el curso en Moodle'
    }
    throw error
  } else {
    console.log('holaaa else')
    await courseDB.update(course.ref, {
      moodleId: courseEnroll.id
    })
  }
  console.log('courseEnroll', courseEnroll)

  return courseEnroll
}

const createEnrolUser = async ({ user, course }) => {
  let courseId
  if (course.moodleId) {
    courseId = course.moodleId
  } else {
    const courseEnroll = await findMoodleCourse(course)
    courseId = courseEnroll.id
  }

  let userId
  if (user.moodleId) {
    userId = user.moodleId
  } else {
    const newUser = await createNewUser(user)
    userId = newUser.id
  }

  const enroll = {
    roleid: '5',
    userid: userId,
    courseid: courseId
  }

  const enrolUserCourse = await actionMoodle('POST', enrolCourse, {
    enrolments: [enroll]
  })

  console.log('enrolUserCourse', enrolUserCourse)
  console.log('enrolUserCourse', enrolUserCourse[0])

  return enrolUserCourse[0]
}

module.exports = {
  createNewUser,
  createEnrolUser
}
