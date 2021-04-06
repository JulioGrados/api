'use strict'
const _ = require('lodash')
const slug = require('slug')
let randomize = require('randomatic')

const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const {
  userDB,
  courseDB,
  examDB,
  taskDB,
  certificateDB,
  lessonDB,
  chapterDB,
  testimonyDB
} = require('../db')
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
const enrol = require('db/models/enrol')

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

const createUserCertificate = async usersMoodle => {
  const users = await userDB.list({})
  const userNew = usersMoodle.map(async element => {
    // console.log(element)
    const user = users.find(
      item =>
        parseInt(item.moodleId) === parseInt(element.id) ||
        item.email === element.email ||
        item.username === element.username
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
      // shippings: []
    }

    if (user) {
      try {
        const updateUser = await userDB.update(user._id, {
          moodleId: element.id,
          email: user.email ? user.email : element.email,
          username: user.username ? user.username : element.username,
          roles: [...user.roles, 'Estudiante']
          // shippings: []
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

const createUserCourse = async (usersMoodle, course) => {
  const users = await userDB.list({})
  const enrols = await enrolDB.list({
    query: { 'course.moodleId': course.moodleId }
  })

  const userNew = usersMoodle.map(async element => {
    // console.log(element)
    const user = users.find(
      item =>
        parseInt(item.moodleId) === parseInt(element.id) ||
        item.email === element.email ||
        item.username === element.username
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
      // shippings: []
    }

    const enrol = enrols.find(
      item => parseInt(item.linked.moodleId) === parseInt(element.id) && parseInt(item.course.moodleId) === parseInt(course.moodleId)
    )
    console.log('enrol', enrol)

    if (user) {
      try {
        const updateUser = await userDB.update(user._id, {
          moodleId: element.id,
          email: user.email ? user.email : element.email,
          username: user.username ? user.username : element.username,
          roles: [...user.roles, 'Estudiante']
          // shippings: []
        })
        console.log('Se actualizó usuario:', updateUser)
        if (!enrol) {
          const data = {
            linked: {
              ...updateUser.toJSON(),
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
          } catch (error) {
            console.log('error al crear un nuevo enrol', error)
          }
        } 
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
        console.log('Se creo usuario:', user)
        const data = {
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
        } catch (error) {
          console.log('error al crear un nuevo enrol', error)
        }
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

const usersMoodle = async ({ courseId }) => {
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }

  const usersMoodle = await actionMoodle('POST', enrolGetCourse, {
    courseid: courseId
  })
  const respUsers = await createUserCourse(usersMoodle, course)

  if (respUsers.errorUsers.length > 0) {
    return respUsers.errorUsers
  }
  
  return respUsers.validUsers
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

const enrolCron = async (grades) => {
  const users = await userDB.list({})
  const enrols = await enrolDB.list({})
  const courses = await courseDB.list({})
  console.log('grades mando', grades)
  const enrolsNew = grades.map(async grade => {
    const course = courses.find(item =>  item.moodleId === grade.courseid )
    const user = users.find(item =>  item.moodleId === grade.userid )
    const enrol = enrols.find(item => parseInt(item.linked.moodleId) === parseInt(grade.userid) && parseInt(item.course.moodleId) === parseInt(grade.courseid))
    console.log('course', course.moodleId)
    if (course && course.typeOfEvaluation === 'exams') {
      let examsBD
      try {
        examsBD = await examDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }

      const exams = examsBD.map(exam => {
        const result = grade.gradeitems.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          exam: exam._id
        }
        return data
      })

      const examEnd = calculateProm(exams)

      if (course.numberEvaluation !== exams.length) {
        examEnd.isFinished = false
      }
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
          console.log('Error al actualizar enrol:', error)
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
    } else if (course && course.typeOfEvaluation === 'tasks') {
      let tasksBD
      try {
        tasksBD = await taskDB.list({
          query: { 'course.moodleId': course.moodleId },
          sort: 'number'
        })
      } catch (error) {
        return error
      }

      const tasks = tasksBD.map(task => {
        const result = grade.gradeitems.find(
          item => item.itemname === task.name
        )
        console.log('result', result)
        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          task: task._id
        }
        return data
      })

      const taskEnd = calculateProm(tasks)

      if (course.numberEvaluation !== tasks.length) {
        examEnd.isFinished = false
      }

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
    } else if (course && course.typeOfEvaluation === 'both') {
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

      const exams = examsBD.map(exam => {
        const result = grade.gradeitems.find(
          item => item.itemname === exam.name
        )

        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
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
          date: result && result.gradedategraded,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const bothEnd = calculatePromBoth(exams, tasks)

      if (course.numberEvaluation !== tasks.length + exams.length) {
        examEnd.isFinished = false
      }

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
          console.log('Error al actualizar enrol:', error)
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
    }
  })
  const results = await Promise.all(enrolsNew.map(p => p.catch(e => e)))
  const validEnrols = results.filter(result => !result.error)
  const errorEnrols = results.filter(result => result.error)

  return { validEnrols, errorEnrols }
}

const createEnrolCourse = async (grades, course) => {
  const users = await userDB.list({})
  const enrols = await enrolDB.list({
    query: { 'course.moodleId': course.moodleId }
  })

  const lessons = await lessonDB.list({
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
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          exam: exam._id
        }
        return data
      })

      const examEnd = calculateProm(exams)

      if (course.numberEvaluation !== exams.length) {
        examEnd.isFinished = false
      }

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
        console.log('result', result)
        const data = {
          number: task.number,
          name: task.name,
          score: result && result.graderaw,
          date: result && result.gradedategraded,
          isTaken:
            result && result.graderaw && parseInt(result.graderaw) >= 11
              ? true
              : false,
          task: task._id
        }
        return data
      })

      const taskEnd = calculateProm(tasks)

      if (course.numberEvaluation !== tasks.length) {
        examEnd.isFinished = false
      }

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
          date: result && result.gradedategraded,
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
          date: result && result.gradedategraded,
          isTaken: result && parseInt(result.graderaw) >= 11 ? true : false,
          task: task._id
        }
        return data
      })

      const bothEnd = calculatePromBoth(exams, tasks)

      if (course.numberEvaluation !== tasks.length + exams.length) {
        examEnd.isFinished = false
      }

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

const certificateCron = async (arr) => {
  const enrols = await enrolDB.list({})
  const certificates = await certificateDB.list({populate: ['linked.ref']})
  const courses = await courseDB.list({})
  const certificateNew = arr.map(async enrol => {
    const course = courses.find( item => item.moodleId === enrol.course.moodleId )
    const certificate =
      enrol.linked &&
      enrol.linked.ref &&
      certificates.find(item => {
        if (
          item.linked &&
          item.linked.ref &&
          item.linked.ref.email === enrol.linked.email
        ) {
          return item
        }
      })
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
  const results = await Promise.all(certificateNew.map(p => p.catch(e => e)))
  const validCertificates = results.filter(result => !result.error)
  const errorCertificates = results.filter(result => result.error)

  return { validCertificates, errorCertificates }
}

const createCertificatesCourse = async course => {
  const enrols = await enrolDB.list({
    query: { 'course.moodleId': course.moodleId, isFinished: true },
    populate: ['linked.ref']
  })

  const certificates = await certificateDB.list({
    query: { 'course.ref': course._id },
    populate: ['linked.ref']
  })

  const enrolsCertificate = enrols.map(async enrol => {
    // console.log('enrol', enrol.linked.ref.firstName)

    const certificate =
      enrol.linked &&
      enrol.linked.ref &&
      certificates.find(item => {
        if (
          item.linked &&
          item.linked.ref &&
          item.linked.ref.email === enrol.linked.ref.email
        ) {
          return item
        }
      })

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
        date: element.timemodified,
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

const usersGrades = async ({ courseId, usersMoodle }) => {
  console.log('userMoodle', usersMoodle)
  let grades = []
  await usersMoodle.reduce(async (promise, user) => {
    await promise
    const contents = await actionMoodle('POST', gradeUser, {
      userid: user.moodleId,
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
  console.log('grades', grades)
  return grades
}

const gradesCron = async ( arr ) => {
  let grades = []
  await arr.reduce(async (promise, item) => {
    await promise
    const contents = await actionMoodle('POST', gradeUser, {
      userid: item.id,
      courseid: item.courseid
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
  return grades
}

const evaluationMoodle = async ({ courseId }) => {
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }

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
      return createExams.errorEvaluations
    }

    if (createTasks.errorEvaluations.length > 0) {
      return createTasks.errorEvaluations
    }
    console.log('createExams', createExams)
    console.log('createTasks', createTasks)
    return [
      createExams.validEvaluations,
      createTasks.validEvaluations
    ]
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
  }else if (course.typeOfEvaluation === 'tasks') {
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

  return createEvaluations.validEvaluations
}

const enrolMoodle = async ({ courseId, grades }) => {
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }
  const respEnrols = await createEnrolCourse(grades, course)
  if (respEnrols.errorEnrols.length > 0) {
    return respEnrols.errorEnrols
  }
  return respEnrols.validEnrols
}

const certificateMoodle = async ({ courseId }) => {
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }
  const certificates = await createCertificatesCourse(course)
  if (certificates.errorCertificates.length > 0) {
    return certificates.errorCertificates
  }

  return certificates.validCertificates
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

  const respUsers = await createUserCertificate(usersMoodle)

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
  }
  if (course.typeOfEvaluation === 'tasks') {
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

const chaptersModuleCourse = async modules => {
  const chapters = await chapterDB.list({})
  
  let chaptersModules = []
  modules.forEach(item => {
    const chaptersModule = item.modules && item.modules.filter(
      item =>
        item.modname === 'label' &&
        item.visible === 1 &&
        item.description.includes('player.vimeo.com')
    )
    chaptersModule.forEach(chapter => {
      let nameChapter = chapter.name.replace(/[\r\n]+/gm, '')
      if (nameChapter.length > 0) {
        while (
        (nameChapter.charAt(0) >= 0 && nameChapter.charAt(0) <= 9) ||
          nameChapter.charAt(0) === ' ' ||
          nameChapter.charAt(0) === '.'
        ) {
          nameChapter = nameChapter.substring(1, nameChapter.length)
        }
        chapter.name = nameChapter
          .replace(/&/g, '&amp;')
          .replace(/>/g, '&gt;')
          .replace(/</g, '&lt;')
          .replace(/"/g, '&quot;')
      }
      chaptersModules.push(chapter)
    })
  })
  
  const chaptersSave = chaptersModules.map(async item => {
    const chapter = chapters.find(element => element.moodleId === item.instance)

    if (chapter) {
      try {
        const chapt = await chapterDB.update(chapter._id, {
          name: item.name,
          slug: slug(item.name.toLowerCase()),
          description: item.description,
          video: item.description,
          moodleId: item.instance
        })
        // console.log('Se actualizó capítulo que existe:', chapt)
        return chapt
      } catch (error) {
        // console.log('Error al actualizar capítulo que existe:', error)
        throw {
          type: 'Actualizar capítulo',
          message: `No actualizó el capítulo ${chapter.name}`,
          metadata: chapter,
          error: error
        }
      }
    } else {
      const data = {
        name: item.name,
        moodleId: item.instance,
        slug: slug(item.name),
        description: item.description,
        video: item.description
      }

      try {
        const chapt = await chapterDB.create(data)
        // console.log('Se creó el capítulo:', chapt)
        return chapt
      } catch (error) {
        // console.log('Error al crear un capítulo')
        throw {
          type: 'Crear capítulo',
          message: `No creó el capítulo ${data.name}`,
          metadata: data,
          error: error
        }
      }
    }
  })

  const results = await Promise.all(chaptersSave.map(p => p.catch(e => e)))
  const validChapters = results.filter(result => !result.error)
  const errorChapters = results.filter(result => result.error)

  return { validChapters, errorChapters }
}

const listModulesCourse = async (courseId, modulesFilter) => {
  const chapters = await chapterDB.list({})
  const modules = await lessonDB.list({
    query: { 'course.moodleId': courseId }
  })

  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }
  let evaluations = []
  if (course.typeOfEvaluation === 'exams') {
    let examsBD
    try {
      examsBD = await examDB.list({
        query: { 'course.moodleId': courseId }
      })
    } catch (error) {
      return error
    }
    evaluations = examsBD
  } else if (course.typeOfEvaluation === 'tasks') {
    let tasksBD
    try {
      tasksBD = await taskDB.list({
        query: { 'course.moodleId': courseId }
      })
    } catch (error) {
      return error
    }
    evaluations = tasksBD
  } else if (course.typeOfEvaluation === 'both') {
    let examsBD
    try {
      examsBD = await examDB.list({
        query: { 'course.moodleId': courseId }
      })
    } catch (error) {
      return error
    }
    let tasksBD
    try {
      tasksBD = await taskDB.list({
        query: { 'course.moodleId': courseId }
      })
    } catch (error) {
      return error
    }
    examsBD.forEach(item => evaluations.push(item))
    tasksBD.forEach(item => evaluations.push(item))
  }

  // console.log('item', modulesFilter)
  const modulesSave = modulesFilter.map(async (item, index) => {
    
    let nameModule = item.name
    while (
      (nameModule.charAt(0) >= 0 && nameModule.charAt(0) <= 9) ||
      nameModule.charAt(0) === ' ' ||
      nameModule.charAt(0) === '.'
    ) {
      nameModule = nameModule.substring(1, nameModule.length)
    }
    
    nameModule = nameModule.replace(/[\r\n]+/gm, '')
    nameModule = nameModule
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    
    const resourcesModule =
      item.modules &&
      item.modules.filter(
        item =>
          (item.modname === 'url' || item.modname === 'resource') &&
          item.visible === 1
      )
    
    const evaluationModule =
      item.modules &&
      item.modules.find(
        item =>
          (item.modname === 'assign' || item.modname === 'quiz') &&
          item.visible === 1
      )
    
    const evaluation =
      evaluationModule &&
      evaluations.find(item => item.moodleId === evaluationModule.instance)
    
    const chaptersModule =
      item.modules &&
      item.modules.filter(
        item =>
          item.modname === 'label' &&
          item.visible === 1 &&
          item.description.includes('player.vimeo.com')
      )
    console.log('7')
    let listChapters = []
    chaptersModule &&
      chaptersModule.forEach((item, index) => {
        const chapter = chapters.find(
          element => element.moodleId === item.instance
        )
        if (chapter) {
          listChapters.push({
            name: chapter.name,
            order: index + 1,
            moodleId: chapter.moodleId,
            ref: chapter._id
          })
        }
      })
    
    const resources =
      resourcesModule &&
      resourcesModule.map((item, index) => {
        const url = item.contents && item.contents[0] && item.contents[0].fileurl
          .replace('/webservice', '')
          .replace('?forcedownload=1', '')
        const resource = {
          name: item.name,
          order: index + 1,
          description: item.modname,
          moodleId: item.instance,
          url: url
        }
        return resource
      })
    const evaluationEnd = evaluation && {
      name: evaluation.name,
      number: evaluation.number,
      moodleId: evaluation.moodleId,
      ref: evaluation._id
    }
    const moodleId = courseId + 'm' + item.id
    const data = {
      order: index + 1,
      name: nameModule,
      moodleId: moodleId,
      slug: slug(nameModule.toLowerCase()),
      resources: resources && resources,
      chapters: listChapters && listChapters,
      evaluation: evaluationEnd && evaluationEnd,
      course: {
        name: course.name,
        moodleId: course.moodleId,
        ref: course._id
      }
    }
    
    const lesson = modules.find(element => element.moodleId === (moodleId))
    if (lesson) {
      try {
        const mod = await lessonDB.update(lesson._id, {
          name: nameModule,
          slug: slug(nameModule.toLowerCase()),
          moodleId: moodleId,
          resources: resources && resources,
          chapters: listChapters && listChapters,
          evaluation: {
            name: evaluation && evaluation.name,
            number: evaluation && evaluation.number,
            moodleId: evaluation && evaluation.moodleId,
            ref: evaluation && evaluation._id
          }
        })
        // console.log('Se actualizó modulo que existe:', mod)
        return mod
      } catch (error) {
        // console.log('Error al actualizar modulo que existe:', error)
        throw {
          type: 'Actualizar modulo',
          message: `No actualizó el modulo ${lesson.name}`,
          metadata: lesson,
          error: error
        }
      }
    } else {
      try {
        const mod = await lessonDB.create(data)
        // console.log('Se creó el modulo:', mod)
        return mod
      } catch (error) {
        // console.log('Error al crear un modulo')
        throw {
          type: 'Crear modulo',
          message: `No creó el modulo ${data.name}`,
          metadata: data,
          error: error
        }
      }
    }
  })
  const results = await Promise.all(modulesSave.map(p => p.catch(e => e)))
  const validModules = results.filter(result => !result.error)
  const errorModules = results.filter(result => result.error)

  return { validModules, errorModules }
}

const modulesCourse = async ({ courseId }) => {
  const feedBackModule = await actionMoodle('GET', moduleGetCourse, {
    courseid: courseId
  })

  const modulesFilter = feedBackModule.filter(
    item => item.name !== 'General' && item.visible === 1
  )
  
  const respChapters = await chaptersModuleCourse(modulesFilter)
  
  if (respChapters.errorChapters.length > 0) {
    console.log(respChapters.errorChapters)
    return respChapters.errorChapters
  }

  const respModules = await listModulesCourse(courseId, modulesFilter)
  if (respModules.errorModules.length > 0) {
    return respModules.errorModules
  }
  // console.log(modulesFilter)
  return respModules.validModules
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
  console.log('user moodle create', user)
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

const createTestimonies = async (feedBackCourse, course) => {
  const users = await userDB.list({})
  const testimonies = await testimonyDB.list({})

  const feedback = feedBackCourse.feedbacks.find(
    item => item.name.indexOf('Encuesta') > -1
  )

  if (feedback) {
    const feedBackModule = await actionMoodle('GET', feedbackGetQuiz, {
      feedbackid: feedback.id
    })

    const newsFeedBack = feedBackModule.attempts.map(async element => {
      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(element.userid)
      )

      if (user) {
        const data = {
          linked: { ref: user._id },
          firstName: user.firstName,
          lastName: user.lastName,
          dni: user.dni && user.dni,
          city: user.city && user.city,
          photo: user.photo && user.photo,
          rate:
            element.responses[0].rawval === '1'
              ? 5
              : element.responses[0].rawval === '2'
              ? 4
              : element.responses[0].rawval === '3'
              ? 3
              : element.responses[0].rawval === '4'
              ? 2
              : element.responses[0].rawval === '5'
              ? 1
              : '',
          moodleId: element.id,
          comment: element.responses[5].rawval,
          status: 'Revisar',
          course: {
            name: course.name,
            slug: course.slug,
            category: {
              name: course.category.name,
              ref: course.category.ref
            },
            ref: course._id
          }
        }

        const testimony = testimonies.find(
          item => parseInt(item.moodleId) === parseInt(element.id)
        )

        if (testimony) {
          try {
            const testi = await testimonyDB.update(testimony._id, {
              rate:
                element.responses[0].rawval === '1'
                  ? 5
                  : element.responses[0].rawval === '2'
                  ? 4
                  : element.responses[0].rawval === '3'
                  ? 3
                  : element.responses[0].rawval === '4'
                  ? 2
                  : element.responses[0].rawval === '5'
                  ? 1
                  : '',
              comment: element.responses[5].rawval
            })
            console.log('Se actualizó testimonio que existe:', testi)
            return testi
          } catch (error) {
            console.log('Error al actualizar testimonio que existe:', error)
            throw {
              type: 'Actualizar testimonio',
              message: `No actualizó el testimonio ${data.comment}`,
              metadata: chapter,
              error: error
            }
          }
        } else {
          try {
            const testi = await testimonyDB.create(data)
            console.log('Se creó el testimonio:', testi)
            return testi
          } catch (error) {
            console.log('Error al crear un testimonio')
            throw {
              type: 'Crear testimonio',
              message: `No creó el testimonio ${data.moodleId}`,
              metadata: data,
              error: error
            }
          }
        }
      } else {
        return {}
      }
    })
    const results = await Promise.all(newsFeedBack.map(p => p.catch(e => e)))
    const validTestimonies = results.filter(result => !result.error)
    const errorTestimonies = results.filter(result => result.error)

    return { validTestimonies, errorTestimonies }
  } else {
    return {}
  }
}

const testimoniesCourse = async ({ courseId }) => {
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: courseId } })
  } catch (error) {
    throw error
  }

  console.log('course', course)

  const feedBackCourse = await actionMoodle('GET', feedbackListCourse, {
    courseids: [course.moodleId]
  })

  const respTestimonies = await createTestimonies(feedBackCourse, course)

  if (respTestimonies.errorTestimonies.length > 0) {
    console.log(respTestimonies.errorTestimonies)
    return respTestimonies.errorTestimonies
  }
  // console.log(modulesFilter)
  return respTestimonies.validTestimonies
}

module.exports = {
  createNewUser,
  createUserCertificate,
  gradesCron,
  enrolCron,
  certificateCron,
  createEnrolUser,
  usersMoodle,
  usersGrades,
  evaluationMoodle,
  enrolMoodle,
  certificateMoodle,
  getUsersForField,
  getCourseForUser,
  searchUser,
  gradeNewCertificate,
  modulesCourse,
  testimoniesCourse
}