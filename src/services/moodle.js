// 'use strict'

// const moodle_client = require('moodle-client')
// const { wwwroot, token, service } = require('config').moodle
// const { userDB, courseDB } = require('../db')

// const init = moodle_client.init({
//   wwwroot,
//   token,
//   service
// })

// const {
//   getCourses,
//   enrolCourse,
//   createUser,
//   userField,
//   coursesUser,
//   gradeUser,
//   enrolGetCourse
// } = require('config').moodle.functions

// const actionMoodle = (method, wsfunction, args = {}) => {
//   return init.then(function (client) {
//     return client
//       .call({
//         wsfunction,
//         method,
//         args
//       })
//       .then(function (info) {
//         return info
//       })
//       .catch(function (err) {
//         throw err
//       })
//   })
// }

// const getCourseForUser = async userId => {
//   try {
//     const coursesForUser = await actionMoodle('GET', coursesUser, {
//       userid: userId
//     })

//     return coursesForUser
//   } catch (error) {
//     console.log('error coursesUser', error)
//     return []
//   }
// }

// const getUsersForField = async (name, value) => {
//   const field = name // 'email'
//   const values = [value] // ['Halanoca29@hotmail.com']

//   // Las variables enviadas a la función deben ser field con el atributo y values con un array que contenga el valor del atributo

//   const userMoodle = await actionMoodle('GET', userField, {
//     field,
//     values
//   })

//   console.log('userMoodle', userMoodle)
//   return userMoodle[0]
// }

// const searchUser = async ({ username, email }) => {
//   let user
//   if (username) {
//     user = await getUsersForField('username', username)
//     if (user) {
//       return { type: 'username', user }
//     }
//   }
//   if (email) {
//     user = await getUsersForField('email', email)
//     if (user) {
//       return { type: 'email', user }
//     }
//   }
//   return { user: undefined }
// }

// const createNewUser = async user => {
//   const dataUser = {
//     email: user.email,
//     firstname: user.firstName,
//     lastname: user.lastName,
//     username: user.username,
//     password: user.password
//   }
//   console.log('dataUser', dataUser)
//   const userMoodle = await actionMoodle('POST', createUser, {
//     users: [dataUser]
//   })

//   console.log('userMoodle', userMoodle[0])
//   if (userMoodle && userMoodle.length) {
//     await userDB.update(user._id, { moodleId: userMoodle[0].id })
//   } else {
//     const error = {
//       status: 500,
//       message: 'No se pudo crear el usuario de Moodle'
//     }
//     throw error
//   }
//   return userMoodle[0]
// }

// const gradeNewUser = async user => {
//   const grade = {
//     userid: 820,
//     courseid: 3,
//     groupid: 0
//   }
//   console.log('dataUser', grade)
//   const userMoodle = await actionMoodle('POST', gradeUser, {
//     userid: 820,
//     courseid: 3
//   })

//   // const userMoodle = await actionMoodle('POST', enrolGetCourse, {
//   //   courseid: 3
//   // })

//   console.log('userMoodle', userMoodle.usergrades[0].gradeitems)
//   if (userMoodle && userMoodle.length) {
//     // await userDB.update(user._id, { moodleId: userMoodle[0].id })
//   } else {
//     const error = {
//       status: 500,
//       message: 'No se pudo crear el usuario de Moodle'
//     }
//     throw error
//   }
//   return userMoodle[0]
// }

// const findMoodleCourse = async course => {
//   const courses = await actionMoodle('GET', getCourses)
//   const courseEnroll = courses.find(item => item.fullname === course.name)
//   if (!courseEnroll) {
//     const error = {
//       status: 404,
//       message: 'No se encontro el curso en Moodle'
//     }
//     throw error
//   } else {
//     const courseId = course.ref._id || course.ref || course._id
//     await courseDB.update(courseId, {
//       moodleId: courseEnroll.id
//     })
//   }

//   return courseEnroll
// }

// const createEnrolUser = async ({ user, course }) => {
//   let courseId
//   if (course.ref && course.ref.moodleId) {
//     courseId = course.ref.moodleId
//   } else {
//     const courseEnroll = await findMoodleCourse(course)
//     courseId = courseEnroll.id
//   }

//   let userId
//   if (user.moodleId) {
//     userId = user.moodleId
//   } else {
//     const newUser = await createNewUser(user)
//     userId = newUser.id
//   }

//   const enroll = {
//     roleid: '5',
//     userid: parseInt(userId),
//     courseid: parseInt(courseId)
//   }

//   await actionMoodle('POST', enrolCourse, {
//     enrolments: [enroll]
//   })

//   return true
// }

// module.exports = {
//   createNewUser,
//   createEnrolUser,
//   getUsersForField,
//   getCourseForUser,
//   searchUser,
//   gradeNewUser
// }

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
  createUser,
  userField,
  coursesUser
} = require('config').moodle.functions

const actionMoodle = (method, wsfunction, args = {}) => {
  return init.then(function (client) {
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

const getCourseForUser = async userId => {
  try {
    const coursesForUser = await actionMoodle('GET', coursesUser, {
      userid: userId
    })

    return coursesForUser
  } catch (error) {
    console.log('error coursesUser', error)
    return []
  }
}

const getUsersForField = async (name, value) => {
  const field = name // 'email'
  const values = [value] // ['Halanoca29@hotmail.com']

  // Las variables enviadas a la función deben ser field con el atributo y values con un array que contenga el valor del atributo

  const userMoodle = await actionMoodle('GET', userField, {
    field,
    values
  })

  console.log('userMoodle', userMoodle)
  return userMoodle[0]
}

const searchUser = async ({ username, email }) => {
  let user
  if (username) {
    user = await getUsersForField('username', username)
    if (user) {
      return { type: 'username', user }
    }
  }
  if (email) {
    user = await getUsersForField('email', email)
    if (user) {
      return { type: 'email', user }
    }
  }
  return { user: undefined }
}

const createNewUser = async user => {
  const dataUser = {
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
    username: user.username,
    password: user.password
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
  const courseEnroll = courses.find(item => item.fullname === course.name)
  if (!courseEnroll) {
    const error = {
      status: 404,
      message: 'No se encontro el curso en Moodle'
    }
    throw error
  } else {
    const courseId = course.ref._id || course.ref || course._id
    await courseDB.update(courseId, {
      moodleId: courseEnroll.id
    })
  }

  return courseEnroll
}

const createEnrolUser = async ({ user, course }) => {
  let courseId
  if (course.ref && course.ref.moodleId) {
    courseId = course.ref.moodleId
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
    userid: parseInt(userId),
    courseid: parseInt(courseId)
  }

  await actionMoodle('POST', enrolCourse, {
    enrolments: [enroll]
  })

  return true
}

module.exports = {
  createNewUser,
  createEnrolUser,
  getUsersForField,
  getCourseForUser,
  searchUser
}
