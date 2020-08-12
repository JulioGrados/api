

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

// const createEnrolUser = async ({ user, course }) =
'use strict'
const _ = require('lodash')
var randomize = require('randomatic')

const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const { userDB, courseDB, examDB, taskDB, certificateDB } = require('../db')
const { enrolDB } = require('db/lib')

const { calculateProm, calculatePromBoth } = require('utils/functions/enrol')

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
  enrolGetCourse,
  quizGetCourse,
  assignGetCourse,
  moduleGetCourse,
  feedbackGetQuiz,
  feedbackListCourse
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

const createUserCourse = async usersMoodle => {
  const users = await userDB.list({})
  const userNew = usersMoodle.map(async element => {
    // console.log(element)
    const user = users.find(
      item =>
        parseInt(item.moodleId) === parseInt(element.id) ||
        item.email === element.email
    )

    const data = {
      moodleId: element.id,
      username: element.username,
      firstName: element.firstname,
      lastName: element.lastname,
      names: element.firstname + ' ' + element.lastname,
      email: element.email,
      country: element.country === 'PE' ? 'Perú' : '',
      city: element.city,
      role: undefined,
      roles: ['Estudiante']
    }

    if (user) {
      try {
        const updateUser = await userDB.update(user._id, {
          moodleId: element.id,
          roles: [...user.roles, 'Estudiante']
        })
        console.log('Se actualizó usuario:')
        return updateUser
      } catch (error) {
        console.log('error al editar usuario')
        throw {
          type: 'Actualizar usuario',
          message: `No actualizó el usuario ${user.names}`,
          metadata: user,
          error: error
        }
      }
    } else {
      try {
        const user = await userDB.create(data)
        console.log('Se creo usuario:')
        return user
      } catch (error) {
        console.log('error al crear usuario')
        throw {
          type: 'Crear usuario',
          message: `No creó el usuario ${data.names}`,
          metadata: data,
          error: error
        }
      }
    }
  })
  // const usersCreate = await Promise.all(userNew)
  const results = await Promise.all(userNew.map(p => p.catch(e => e)))
  const validUsers = results.filter(result => !result.error)
  const errorUsers = results.filter(result => result.error)

  return { validUsers, errorUsers }
}

const createExamCourse = async (exams, course) => {
  let examsBD
  try {
    examsBD = await examDB.list({
      query: { 'course.moodleId': course.moodleId }
    })
  } catch (error) {
    return error
  }

  const examsNew = exams.map(async (element, idx) => {
    const exam = examsBD.find(
      item => parseInt(item.moodleId) === parseInt(element.id)
    )

    const data = {
      moodleId: element.id,
      name: element.name,
      description: element.intro,
      number: idx + 1,
      course: {
        ...course.toJSON(),
        ref: course._id
      }
    }

    if (exam) {
      try {
        const examNew = await examDB.update(exam._id, {
          number: idx + 1,
          moodleId: element.id,
          description: element.intro
        })
        console.log('Se actualizó examen:', examNew)
        return examNew
      } catch (error) {
        console.log('Error al actualizar examen:', error)
        throw {
          type: 'Actualizar examen',
          message: `No actualizó el examen ${examNew.number}`,
          metadata: exam,
          error: error
        }
      }
    } else {
      try {
        const examNew = await examDB.create(data)
        console.log('Se creó examen:', examNew)
        return examNew
      } catch (error) {
        console.log('Error al crear examen', error)
        throw {
          type: 'Crear examen',
          message: `No creó el examen ${data.number}`,
          metadata: data,
          error: error
        }
      }
    }
  })
  // const examsCreate = await Promise.all(examsNew)
  const results = await Promise.all(examsNew.map(p => p.catch(e => e)))
  const validEvaluations = results.filter(result => !result.error)
  const errorEvaluations = results.filter(result => result.error)

  return { validEvaluations, errorEvaluations }
}

const createTaskCourse = async (tasks, course) => {
  let tasksBD
  try {
    tasksBD = await taskDB.list({
      query: { 'course.moodleId': course.moodleId }
    })
  } catch (error) {
    return error
  }
  const tasksNew = tasks.map(async (element, idx) => {
    const task = tasksBD.find(item => item.name === element.name)

    const data = {
      moodleId: element.id,
      name: element.name,
      description: element.intro,
      number: idx + 1,
      course: {
        ...course.toJSON(),
        ref: course._id
      }
    }

    if (task) {
      try {
        const taskNew = await taskDB.update(task._id, {
          number: idx + 1,
          moodleId: element.id,
          description: element.intro
        })
        console.log('Se actualizó una tarea:', taskNew)
        return taskNew
      } catch (error) {
        console.log('error al actualizar tarea', error)
        throw {
          type: 'Actualizar tarea',
          message: `No actualizó la tarea ${task.number}`,
          metadata: task,
          error: error
        }
      }
    } else {
      try {
        const taskNew = await taskDB.create(data)
        console.log('Se creó una tarea:', taskNew)
        return taskNew
      } catch (error) {
        console.log('error al crear tarea', error)
        throw {
          type: 'Crear tarea',
          message: `No creó la tarea ${data.number}`,
          metadata: data,
          error: error
        }
      }
    }
  })
  const results = await Promise.all(tasksNew.map(p => p.catch(e => e)))
  const validEvaluations = results.filter(result => !result.error)
  const errorEvaluations = results.filter(result => result.error)

  return { validEvaluations, errorEvaluations }
}

const createEnrolCourse = async (grades, course) => {
  const users = await userDB.list({})
  const enrols = await enrolDB.list({
    query: { 'course.moodleId': course.moodleId }
  })

  let enrolsNew
  if (course.typeOfEvaluation === 'exams') {
    let examsBD
    try {
      examsBD = await examDB.list({
        query: { 'course.moodleId': course.moodleId },
        sort: 'number'
      })
    } catch (error) {
      return error
    }
    enrolsNew = grades.map(async grade => {
      const enrol = enrols.find(
        item => parseInt(item.linked.moodleId) === parseInt(grade.userid)
      )

      const exams = examsBD.map(exam => {
        const result = grade.gradeitems.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedatesubmitted,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          exam: exam._id
        }
        return data
      })

      const examEnd = calculateProm(exams)

      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(grade.userid)
      )

      let dataEnrol
      if (examEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          isFinished: true,
          score: examEnd.note,
          finalScore: examEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          isFinished: false,
          score: examEnd.note,
          certificate: {}
        }
      }

      if (enrol) {
        try {
          const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
          console.log('Se actualizó enrol:', updateEnroll)
          return updateEnroll
        } catch (error) {
          console.log('Error al actualizar enrol:', updateEnroll)
          throw {
            type: 'Actualizar enrol',
            message: `No actualizó el enrol con examenes ${enrol._id}`,
            metadata: enrol,
            error: error
          }
        }
      } else {
        if (user) {
          const data = {
            ...dataEnrol,
            linked: {
              ...user.toJSON(),
              ref: user._id
            },
            course: {
              ...course.toJSON(),
              ref: course._id
            }
          }

          try {
            const enrol = await enrolDB.create(data)
            console.log('Se creó un nuevo enrol', enrol)
            return enrol
          } catch (error) {
            console.log('error al crear un nuevo enrol', error)
            throw {
              type: 'Crear enrol',
              message: `No creó el enrol con examenes`,
              metadata: data,
              error: error
            }
          }
        } else {
          console.log('not user en enrol')
        }
      }
    })

    const results = await Promise.all(enrolsNew.map(p => p.catch(e => e)))
    const validEnrols = results.filter(result => !result.error)
    const errorEnrols = results.filter(result => result.error)

    return { validEnrols, errorEnrols }
  } else if (course.typeOfEvaluation === 'tasks') {
    let tasksBD
    try {
      tasksBD = await taskDB.list({
        query: { 'course.moodleId': course.moodleId },
        sort: 'number'
      })
    } catch (error) {
      return error
    }

    enrolsNew = grades.map(async grade => {
      const enrol = enrols.find(
        item => parseInt(item.linked.moodleId) === parseInt(grade.userid)
      )

      const tasks = tasksBD.map(task => {
        const result = grade.gradeitems.find(
          item => item.itemname === task.name
        )

        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedatesubmitted,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          task: task._id
        }
        return data
      })

      const taskEnd = calculateProm(tasks)

      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(grade.userid)
      )

      let dataEnrol
      if (taskEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          tasks: tasks,
          isFinished: true,
          score: taskEnd.note,
          finalScore: taskEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          tasks: tasks,
          isFinished: false,
          score: taskEnd.note,
          certificate: {}
        }
      }

      if (enrol) {
        try {
          const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
          console.log('Se actualizó enrol:', updateEnroll)
          return updateEnroll
        } catch (error) {
          console.log('Error al actualizar enrol:', error)
          throw {
            type: 'Actualizar enrol',
            message: `No actualizó el enrol con tareas ${enrol._id}`,
            metadata: enrol,
            error: error
          }
        }
      } else {
        if (user) {
          const data = {
            ...dataEnrol,
            linked: {
              ...user.toJSON(),
              ref: user._id
            },
            course: {
              ...course.toJSON(),
              ref: course._id
            }
          }
          try {
            const enrol = await enrolDB.create(data)
            console.log('Se creó enrol:', enrol)
            return enrol
          } catch (error) {
            console.log('error al crear enrol', error)
            throw {
              type: 'Crear enrol',
              message: `No creó el enrol con tareas`,
              metadata: data,
              error: error
            }
          }
        } else {
          console.log('not user')
        }
      }
    })
    // const enrolsCreate = await Promise.all(enrolsNew)
    const results = await Promise.all(enrolsNew.map(p => p.catch(e => e)))
    const validEnrols = results.filter(result => !result.error)
    const errorEnrols = results.filter(result => result.error)

    return { validEnrols, errorEnrols }
  } else if (course.typeOfEvaluation === 'both') {
    let examsBD
    try {
      examsBD = await examDB.list({
        query: { 'course.moodleId': course.moodleId },
        sort: 'number'
      })
    } catch (error) {
      return error
    }
    let tasksBD
    try {
      tasksBD = await taskDB.list({
        query: { 'course.moodleId': course.moodleId },
        sort: 'number'
      })
    } catch (error) {
      return error
    }

    enrolsNew = grades.map(async grade => {
      const enrol = enrols.find(
        item => parseInt(item.linked.moodleId) === parseInt(grade.userid)
      )

      const exams = examsBD.map(exam => {
        const result = grade.gradeitems.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedatesubmitted,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          exam: exam._id
        }
        return data
      })

      const tasks = tasksBD.map(task => {
        const result = grade.gradeitems.find(
          item => item.itemname === task.name
        )

        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedatesubmitted,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const bothEnd = calculatePromBoth(exams, tasks)

      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(grade.userid)
      )

      let dataEnrol
      if (bothEnd.isFinished) {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          tasks: tasks,
          isFinished: true,
          score: bothEnd.note,
          finalScore: bothEnd.note,
          certificate: {}
        }
      } else {
        dataEnrol = {
          linked: { ...user.toJSON(), ref: user._id },
          exams: exams,
          tasks: tasks,
          isFinished: false,
          score: bothEnd.note,
          certificate: {}
        }
      }

      if (enrol) {
        try {
          const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
          console.log('Se actualizó enrol:', updateEnroll)
          return updateEnroll
        } catch (error) {
          console.log('Error al actualizar enrol:', updateEnroll)
          throw {
            type: 'Actualizar enrol',
            message: `No actualizó el enrol con examenes ${enrol._id}`,
            metadata: enrol,
            error: error
          }
        }
      } else {
        if (user) {
          const data = {
            ...dataEnrol,
            linked: {
              ...user.toJSON(),
              ref: user._id
            },
            course: {
              ...course.toJSON(),
              ref: course._id
            }
          }

          try {
            const enrol = await enrolDB.create(data)
            console.log('Se creó un nuevo enrol', enrol)
            return enrol
          } catch (error) {
            console.log('error al crear un nuevo enrol', error)
            throw {
              type: 'Crear enrol',
              message: `No creó el enrol con examenes`,
              metadata: data,
              error: error
            }
          }
        } else {
          console.log('not user en enrol')
        }
      }
    })

    const results = await Promise.all(enrolsNew.map(p => p.catch(e => e)))
    const validEnrols = results.filter(result => !result.error)
    const errorEnrols = results.filter(result => result.error)

    return { validEnrols, errorEnrols }
  }
}

const createCertificatesCourse = async course => {
  const enrols = await enrolDB.list({
    query: { 'course.moodleId': course.moodleId, isFinished: true }
  })

  const certificates = await certificateDB.list({
    query: { 'course.ref': course._id }
  })
  const enrolsCertificate = enrols.map(async enrol => {
    const certificate = certificates.find(
      item =>
        item.linked &&
        item.linked.firstName === enrol.linked.firstName &&
        item.linked &&
        item.linked.lastName === enrol.linked.lastName
    )

    if (certificate) {
      try {
        const certi = await enrolDB.update(enrol._id, {
          certificate: {
            ...certificate.toJSON(),
            ref: certificate._id
          },
          isFinished: true
        })

        if (enrol.linked) {
          await certificateDB.update(certificate._id, {
            linked: enrol.linked,
            score: enrol.score
          })
        }
        console.log('Se actualizó enrol con certificado que existe:', certi)
        return certi
      } catch (error) {
        console.log(
          'Error al actualizar enrol con certificado que existe:',
          error
        )
        throw {
          type: 'Actualizar certificado',
          message: `No actualizó el certificado ${certificate.code}`,
          metadata: certificate,
          error: error
        }
      }
    } else {
      const code = randomize('a0', 8)
      const data = {
        code: code,
        shortCode: code,
        linked: {
          firstName: enrol && enrol.linked && enrol.linked.firstName,
          lastName: enrol && enrol.linked && enrol.linked.lastName,
          ref: enrol && enrol.linked && enrol.linked.ref
        },
        course: {
          shortName: course && course.shortName,
          academicHours: course && course.academicHours,
          ref: course && course._id
        },
        moodleId: course && course.moodleId,
        enrol: enrol && enrol._id,
        score: enrol.finalScore,
        date: new Date()
      }

      try {
        const certi = await certificateDB.create(data)

        await enrolDB.update(enrol._id, {
          certificate: {
            ...certi.toJSON(),
            ref: certi._id
          }
        })
        console.log('Se creó certificado y actualizó enrol:', certi)
        return certi
      } catch (error) {
        console.log(
          'Error al crear y actualizar enrol con nuevo certificado:',
          certi
        )
        throw {
          type: 'Crear certificado',
          message: `No creó el certificado ${data.code}`,
          metadata: data,
          error: error
        }
      }
    }
  })

  // const certificateCreate = await Promise.all(enrolsCertificate)

  const results = await Promise.all(enrolsCertificate.map(p => p.catch(e => e)))
  const validCertificates = results.filter(result => !result.error)
  const errorCertificates = results.filter(result => result.error)

  return { validCertificates, errorCertificates }
}

const createShippingUser = async course => {
  const users = await userDB.list({})

  const feedBackCourse = await actionMoodle('GET', feedbackListCourse, {
    courseids: [course.moodleId]
  })

  const feedback = feedBackCourse.feedbacks.find(
    item => item.name.indexOf('certificado') > -1
  )

  if (feedback) {
    const feedBackModule = await actionMoodle('GET', feedbackGetQuiz, {
      feedbackid: feedback.id
    })

    const newsFeedBack = feedBackModule.attempts.map(async element => {
      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(element.userid)
      )
      let shippings = []
      const shipping = {
        moodleId: parseInt(element.id),
        firstName: element.responses[0].rawval,
        lastName: element.responses[1].rawval,
        dni: element.responses[2].rawval,
        cellphone: element.responses[3].rawval,
        address: element.responses[4].rawval,
        priority: 'Principal',
        course: {
          name: course.name,
          moodleId: course.moodleId,
          ref: course._id
        }
      }

      if (user) {
        const userFeedBacks = user.shippings

        if (userFeedBacks && userFeedBacks.length > 0) {
          const sending = userFeedBacks.find(
            feed => parseInt(feed.moodleId) === parseInt(element.id)
          )
          shippings = userFeedBacks
          if (!sending) {
            shippings.push(shipping)
          }
        } else {
          shippings.push(shipping)
        }
        try {
          const updateUser = await userDB.update(user._id, {
            shippings: shippings
          })
          console.log('Se actualizó usuario shipping:', updateUser)
          return updateUser
        } catch (error) {
          console.log('error al editar usuario')
          throw {
            type: 'Actualizar usuario',
            message: `No actualizó el usuario ${user.names}`,
            metadata: user,
            error: error
          }
        }
      } else {
        throw {
          type: 'Actualizar usuario',
          message: `No se encontro usuario ${element.fullname}`,
          metadata: element,
          error: error
        }
      }
    })
    const results = await Promise.all(newsFeedBack.map(p => p.catch(e => e)))
    const validShipping = results.filter(result => !result.error)
    const errorShipping = results.filter(result => result.error)

    return { validShipping, errorShipping }
  } else {
    return {}
  }
}

const gradeNewCertificate = async ({ courseId }) => {
  const usersMoodle = await actionMoodle('POST', enrolGetCourse, {
    courseid: courseId
  })
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }

  const respUsers = await createUserCourse(usersMoodle)

  if (respUsers.errorUsers.length > 0) {
    return respUsers.errorUsers
  }

  let grades = []
  await usersMoodle.reduce(async (promise, user) => {
    await promise
    const contents = await actionMoodle('POST', gradeUser, {
      userid: user.id,
      courseid: courseId
    })

    console.log(contents.usergrades[0])
    grades.push(contents.usergrades[0])
  }, Promise.resolve())

  grades.forEach(grade => {
    let gradeFilter = grade.gradeitems.filter(
      item =>
        (item.itemname && item.itemname.indexOf('Evaluación') > -1) ||
        (item.itemname && item.itemname.indexOf('Evaluacion') > -1)
    )
    grade.gradeitems = gradeFilter
  })

  let evaluations
  if (course.typeOfEvaluation === 'exams') {
    evaluations = await actionMoodle('POST', quizGetCourse, {
      courseids: [courseId]
    })
    evaluations = evaluations.quizzes
  } else if (course.typeOfEvaluation === 'tasks') {
    evaluations = await actionMoodle('POST', assignGetCourse, {
      courseids: [courseId]
    })
    evaluations = evaluations.courses[0].assignments
  } else if (course.typeOfEvaluation === 'both') {
    const examsBoth = await actionMoodle('POST', quizGetCourse, {
      courseids: [courseId]
    })

    const tasksBoth = await actionMoodle('POST', assignGetCourse, {
      courseids: [courseId]
    })

    const examsEnd = examsBoth.quizzes
    const tasksEnd = tasksBoth.courses[0].assignments

    const examsFilter = examsEnd.filter(
      evaluation =>
        (evaluation.name && evaluation.name.indexOf('Evaluación') > -1) ||
        (evaluation.name && evaluation.name.indexOf('Evaluacion') > -1)
    )
    console.log('examsFilter', examsFilter)

    const tasksFilter = tasksEnd.filter(
      evaluation =>
        (evaluation.name && evaluation.name.indexOf('Evaluación') > -1) ||
        (evaluation.name && evaluation.name.indexOf('Evaluacion') > -1)
    )
    console.log('tasksFilter', tasksFilter)

    const createExams = await createExamCourse(examsFilter, course)
    const createTasks = await createTaskCourse(tasksFilter, course)

    if (createExams.errorEvaluations.length > 0) {
      return createEvaluations.errorEvaluations
    }

    if (createTasks.errorEvaluations.length > 0) {
      return createTasks.errorEvaluations
    }

    console.log('createExams', createExams)
    console.log('createTasks', createTasks)
  }
  console.log('1')
  const evaluationsFilter =
    evaluations &&
    evaluations.filter(
      evaluation =>
        (evaluation.name && evaluation.name.indexOf('Evaluación') > -1) ||
        (evaluation.name && evaluation.name.indexOf('Evaluacion') > -1)
    )
  console.log('2')
  let createEvaluations
  if (course.typeOfEvaluation === 'exams') {
    createEvaluations = await createExamCourse(evaluationsFilter, course)
  } else if (course.typeOfEvaluation === 'tasks') {
    createEvaluations = await createTaskCourse(evaluationsFilter, course)
  }
  console.log('3')
  if (
    createEvaluations &&
    createEvaluations.errorEvaluations &&
    createEvaluations.errorEvaluations.length > 0
  ) {
    return createEvaluations.errorEvaluations
  }
  const respEnrols = await createEnrolCourse(grades, course)
  if (respEnrols.errorEnrols.length > 0) {
    return respEnrols.errorEnrols
  }

  const respShipping = await createShippingUser(course)
  if (
    respShipping &&
    respShipping.errorShipping &&
    respShipping.errorShipping.length > 0
  ) {
    return respShipping.errorShipping
  }

  const certificates = await createCertificatesCourse(course)
  if (certificates.errorCertificates.length > 0) {
    return certificates.errorCertificates
  }

  return certificates.validCertificates
}

const modulesCourse = async ({ courseId }) => {
  const feedBackModule = await actionMoodle('GET', feedbackGetQuiz, {
    feedbackid: 25
  })

  feedBackModule.attempts.forEach(item => {
    console.log(item)
  })

  const feedBackCourse = await actionMoodle('GET', feedbackListCourse, {
    courseids: [28]
  })

  console.log(feedBackCourse.feedbacks)

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
  gradeNewCertificate,
  modulesCourse
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
