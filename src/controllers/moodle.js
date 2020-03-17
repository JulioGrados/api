'use strict'
const wwwroot = require('config').moodle.wwwroot
const tokenMoodle = require('config').moodle.token
const service = require('config').moodle.service

const getCourses = require('config').moodle.functions.getCourses
const enrolCourse = require('config').moodle.functions.enrolCourse
const createUser = require('config').moodle.functions.createUser

const moodle_client = require('moodle-client')

const urlMigo = require('config').migo.url
const tokenMigo = require('config').migo.token
const axios = require('axios')

const init = moodle_client.init({
  wwwroot: wwwroot,
  token: tokenMoodle,
  service: service
})

const actionMoodle = (method, wsfunction, args = {}) => {
  return init.then(function (client) {
    return client
      .call({
        wsfunction: wsfunction,
        method: method,
        args: {
          args
        }
      })
      .then(function (info) {
        // console.log(info)
        return info
      })
      .catch(function (err) {
        // console.log(err)
        return err
      })
  })
}

const getNamesUser = dni => {
  axios
    .post(urlMigo, {
      token: tokenMigo,
      dni: dni
    })
    .then(function (response) {
      console.log(response.data)
      console.log(response.data.dni)
      console.log(response.data.nombre)
    })
    .catch(function (error) {
      console.log(error.response.status)
    })
}

const createEnrolUser = async (req, res) => {
  const courses = await actionMoodle('GET', getCourses)
  const courseEnrolName = 'Curso de Ecología y Medio Ambiente'
  const courseEnrol = courses.filter(
    course => course.fullname === courseEnrolName
  )

  const userMoodle = {
    username: 'abc1',
    password: '123',
    firstname: 'abc',
    lastname: 'abc',
    email: 'abc1@gmail.com'
  }

  const createUserMoodle = await actionMoodle('POST', createUser, {
    users: [userMoodle]
  })

  const enroll = {
    roleid: '5',
    userid: createUserMoodle.id,
    courseid: courseEnrol.id
  }

  const enrolUserCourse = await actionMoodle('POST', enrolCourse, {
    enrolments: [enroll]
  })
}

module.exports = {
  createEnrolUser
}
