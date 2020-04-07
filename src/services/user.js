'use strict'

const { userDB } = require('../db')
const { getSocket } = require('../lib/io')
const { generateHash } = require('utils').auth
const { saveFile } = require('utils/files/save')
const { createFindQuery } = require('utils/functions/user')
const { createOrUpdateDeal } = require('./deal')
const { createTimeline } = require('./timeline')
const { createNewUser, createEnrolUser, searchUser } = require('./moodle')
const { payloadToData } = require('utils/functions/user')
const { sendMailTemplate } = require('utils/lib/sendgrid')
const { createEmail } = require('./email')

const listUsers = async params => {
  const users = await userDB.list(params)
  return users
}

const createUser = async (body, file, loggedUser) => {
  if (file) {
    const route = await saveFile(file, '/users')
    body.photo = route
  }
  body.password = body.password ? generateHash(body.password) : undefined
  const user = await userDB.create(body)
  return user
}

const updateUser = async (userId, body, file, loggedUser) => {
  try {
    const dataUser = await saveImage(body, file)
    if (dataUser.addMoodle) {
      dataUser.courses = await addCoursesMoodle(dataUser, loggedUser)
    }
    if (dataUser.password) {
      dataUser.password = generateHash(dataUser.password)
    }
    const updateUser = await userDB.update(userId, dataUser)
    return updateUser
  } catch (error) {
    console.log('error', error)
    throw error
  }
}

const detailUser = async params => {
  const user = await userDB.detail(params)
  return user
}

const deleteUser = async (userId, loggedUser) => {
  const user = await userDB.remove(userId)
  return user
}

const createOrUpdateUser = async body => {
  let user
  try {
    const params = createFindQuery(body)
    const lead = await userDB.detail(params)
    user = await userDB.update(lead._id, { ...body })
    await createOrUpdateDeal(user.toJSON(), body)
  } catch (error) {
    if (error.status === 404) {
      user = await userDB.create(body)
      createTimeline({
        linked: user,
        type: 'Cuenta',
        name: 'Persona creada'
      })
      await createOrUpdateDeal(user.toJSON(), body)
    } else {
      throw error
    }
  }
  return user
}

const countDocuments = async params => {
  const count = await userDB.count(params)
  return count
}

/* functions */
const emitLead = user => {
  try {
    const io = getSocket()
    io.emit('user', user)
  } catch (error) {
    console.log('error sockets', user, error)
  }
}

const saveImage = async (user, file) => {
  if (file) {
    const route = await saveFile(file, '/users')
    user.photo = route
  }
  return user
}

const addCoursesMoodle = async (user, logged) => {
  const timeline = {
    linked: {
      names: user.names,
      ref: user._id
    },
    assigned: {
      username: logged.username,
      ref: logged._id
    },
    type: 'Curso'
  }
  if (!user.moodleId) {
    const exist = await searchUser({
      username: user.username,
      email: user.email
    })
    console.log('exist', exist)
    if (exist && exist.user) {
      const err = {
        status: 402,
        message: `Ya existe un usuario con el mismo ${exist.type}`
      }
      throw err
    }
    const moodleUser = await createNewUser(user)
    console.log('moodleUser', moodleUser)
    user.moodleId = moodleUser.id
    createTimeline({
      ...timeline,
      type: 'Cuenta',
      name: '[Cuenta] se creó la cuenta en Moodle'
    })
    sendEmailAccess(user, logged)
  }
  try {
    const courses = await Promise.all(
      user.courses.map(async course => {
        console.log(course)
        if (course.toEnroll === true) {
          await createEnrolUser({ course, user })
          course.isEnrollActive = true
          course.status = 'Matriculado'
          createTimeline({
            ...timeline,
            name: `[Matricula] ${course.name}`
          })
        }
        if (course.changeActive) {
          console.log('cange')
          if (course.isEnrollActive) {
            createTimeline({
              ...timeline,
              name: `[Reactivación] ${course.name}`
            })
          } else {
            createTimeline({
              ...timeline,
              name: `[Suspensión] ${course.name}`
            })
          }
        }
        return course
      })
    )
    console.log('courses', courses)
    return courses
  } catch (error) {
    if (error.status) {
      throw error
    } else {
      const err = {
        status: 500,
        message: 'Ocurrio un error al matricular en Moodle',
        error
      }
      throw err
    }
  }
}

const sendEmailAccess = async (user, logged) => {
  const linked = payloadToData(user)
  const assigned = payloadToData(logged)
  const to = user.email
  const from = 'cursos@eai.edu.pe'
  const templateId = 'd-1283b20fdf3b411a861b30dac8082bd8'
  const preheader = 'Accesos a Moodle'
  const content =
    'Se envio la información de accesos a la cuneta de moodle con la plantilla pre definida en sengrid.'
  const substitutions = {
    username: linked.username,
    password: linked.password,
    name: linked.shorName
  }
  try {
    const email = await createEmail({
      linked,
      assigned,
      from,
      preheader,
      content
    })
    sendMailTemplate({
      to,
      from,
      substitutions,
      templateId: templateId,
      args: {
        emailId: email._id
      }
    })
  } catch (error) {
    console.log('error create email', error)
  }
}

module.exports = {
  countDocuments,
  listUsers,
  createUser,
  updateUser,
  detailUser,
  deleteUser,
  createOrUpdateUser,
  emitLead
}
