'use strict'
const fs = require('fs');
const moodle_client = require('moodle-client')
const { wwwroot, token, service } = require('config').moodle
const {
  userDB,
  courseDB,
  examDB,
  taskDB,
  certificateDB,
  enrolDB
} = require('../db')


const { calculateProm, calculatePromBoth } = require('utils/functions/enrol')
const { sendEmail } = require('utils/lib/sendgrid')

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

const listEnrols = async params => {
  const enrols = await enrolDB.list(params)
  return enrols
}

const createEnrol = async (body, loggedUser) => {
  const enrol = await enrolDB.create(body)
  return enrol
}

const createEmailEnrol = async (body) => {
  const msg = {
    to: body.to,
    cc: body.cc,
    from: 'docente@eai.edu.pe',
    subject: body.subject,
    text: body.text,
    html: body.html,
    fromname: body.fromname,
    attachments: [
      {
        filename: `constancia.pdf`,
        content: body.pdf,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  }
  const enrol = await sendEmail(msg)
  return enrol
}

const updateEnrol = async (enrolId, body, loggedUser) => {
  const enrol = await enrolDB.update(enrolId, body)
  return enrol
}

const updateMoodle = async (enrolId, body, loggedUser) => {
  // const enrol = await enrolDB.update(enrolId, body)
  const users = await userDB.list({})
  const enrol = await enrolDB.detail({ query: { _id: enrolId } })
  
  let course
  try {
    course = await courseDB.detail({ query: { moodleId: enrol.course.moodleId } })
    // console.log('course', course)
  } catch (error) {
    console.log('error')
    throw error
  }

  const contents = await actionMoodle('POST', gradeUser, {
    userid: enrol.linked.moodleId,
    courseid: course.moodleId
  })

  let gradeFilter = contents.usergrades[0].gradeitems.filter(
    item =>
      (item.itemname && item.itemname.indexOf('Evaluación') > -1) ||
      (item.itemname && item.itemname.indexOf('Evaluacion') > -1)
  )

  console.log('contents', contents)
  console.log('gradeFilter', gradeFilter)
  let dataEnrol
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
    // console.log('examsDB', examsDB)

    const exams = examsBD.map(exam => {
      const result = gradeFilter.find(
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
    console.log('exams', exams)

    const examEnd = calculateProm(exams)
    if (course.numberEvaluation !== exams.length) {
      examEnd.isFinished = false
    }

    console.log('examEnd', examEnd)

    const user = users.find(
      item => parseInt(item.moodleId) === parseInt(enrol.linked.moodleId)
    )
    console.log('user', user)
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
    console.log('dataEnrol', dataEnrol)
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

    const tasks = tasksBD.map(task => {
      const result = gradeFilter.find(
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
      item => parseInt(item.moodleId) === parseInt(enrol.linked.moodleId)
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

    console.log('dataEnrol', dataEnrol)
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

    const exams = examsBD.map(exam => {
      const result = gradeFilter.find(
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
      const result = gradeFilter.find(
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
      item => parseInt(item.moodleId) === parseInt(enrol.linked.moodleId)
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
  }
  const enrolUpdate = await enrolDB.update(enrolId, dataEnrol)
  console.log('enrol', enrolUpdate)
  return enrolUpdate
}

const detailEnrol = async params => {
  const enrol = await enrolDB.detail(params)
  return enrol
}

const deleteEnrol = async (enrolId, loggedEnrol) => {
  const enrol = await enrolDB.remove(enrolId)
  return enrol
}

const countDocuments = async params => {
  const count = await enrolDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listEnrols,
  createEnrol,
  createEmailEnrol,
  updateEnrol,
  updateMoodle,
  detailEnrol,
  deleteEnrol
}
