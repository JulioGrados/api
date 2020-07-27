'use strict'

const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const { userDB, courseDB } = require('../db')
const { enrolDB } = require('db/lib')

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
  coursesUser,
  gradeUser,
  enrolGetCourse
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

const gradeNewUser = async courseId => {
  const userMoodle = await actionMoodle('POST', enrolGetCourse, {
    courseid: 4
  })

  const users = await userDB.list({ select: 'email username roles' })
  let course = []
  try {
    course = await courseDB.detail({ query: { moodleId: 4 } })
  } catch (error) {
    console.log(error)
  }

  let enrols = []
  try {
    enrols = await enrolDB.list({ query: { 'course.moodleId': 4 } })
  } catch (error) {
    console.log(error)
  }

  await userMoodle.reduce(async (promise, user) => {
    await promise
    const contents = await actionMoodle('POST', gradeUser, {
      userid: user.id,
      courseid: 4
    })
    console.log(contents)
    const exist = users.find(
      user => user.email === data.email || user.username === data.username
    )
    if (exist) {
      try {
        // const updateUser = await userDB.update(exist._id, {
        //   moodleId: moodleUser.id,
        //   roles: [...exist.roles, 'Estudiante']
        // })
        // console.log('update User', updateUser)
        // return updateUser
      } catch (error) {
        // console.log('error al editar usuario', exist, error)
        // return error
      }
    } else {
      const data = {
        moodleId: user.id,
        username: user.username,
        firstName: user.firstname,
        lastName: user.lastname,
        names: user.firstname + ' ' + user.lastname,
        email: user.email,
        country: user.country === 'PE' ? 'Perú' : '',
        city: user.city,
        role: undefined,
        roles: ['Estudiante']
      }
      try {
        // const user = await userDB.create(data)
        // return user
      } catch (error) {
        // console.log('error al crear usuario', moodleUser)
        // return error
      }
    }
  }, Promise.resolve())

  // const userMoodle = [1, 2, 3]

  // await userMoodle.map(async element => {
  //   const contents = await actionMoodle('POST', gradeUser, {
  //     userid: 820,
  //     courseid: 3
  //   })
  //   console.log(contents)
  //   // console.log(element.id)
  //   console.log('------------------------------------------------------------')
  // })

  return 1
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
  searchUser,
  gradeNewUser
}

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
//   coursesUser
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
//   searchUser
// }
