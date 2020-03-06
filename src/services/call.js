'use strict'

const { callDB, userDB, notificationDB } = require('../db')
const moment = require('moment-timezone')
const { getSocket } = require('../lib/io')

const listCalls = async params => {
  const calls = await callDB.list(params)
  return calls
}

const createCall = async (body, loggedCall) => {
  const call = await callDB.create(body)
  updateUserStateFromCall(call)
  return call
}

const updateCall = async (callId, body, loggedCall) => {
  const call = await callDB.update(callId, body)
  updateUserStateFromCall(call)
  return call
}

const detailCall = async params => {
  const call = await callDB.detail(params)
  return call
}

const deleteCall = async (callId, loggedCall) => {
  const call = await callDB.remove(callId)
  return call
}

const countDocuments = async params => {
  const count = await callDB.count(params)
  return count
}

/* functions */

const getDelayCalls = async () => {
  const calls = await callDB.list({
    query: {
      isCompleted: false,
      date: {
        $lte: moment().endOf('day')
      },
      'linked.ref': { $exists: true }
    },
    populate: {
      path: 'linked.ref',
      match: { statusActivity: { $ne: 'delay' } },
      select: 'statusActivity'
    }
  })

  calls.map(async call => {
    if (call.linked.ref) {
      await updateUserStateFromCall(call)
    }
  })
}

const updateUserStateFromCall = async call => {
  let lead = await getLeadFromCall(call)
  const statusActivity = getNewActivityState(call)
  if (statusActivity !== lead.statusActivity) {
    if (statusActivity === 'delay') {
      sendNotification(call)
    }
    lead = updateStatusUser(lead, statusActivity)
  }
  return lead
}

const getLeadFromCall = async call => {
  let lead
  if (call.linked.ref && call.linked.ref.statusActivity) {
    lead = call.linked.ref
  } else {
    lead = await userDB.detail({
      query: { _id: call.linked.ref },
      select: 'statusActivity'
    })
  }
  return lead
}

const getNewActivityState = call => {
  let statusActivity = ''
  if (!call.isCompleted) {
    const date = getFullDate(call)
    if (moment().isAfter(date)) {
      statusActivity = 'delay'
    } else {
      statusActivity = 'todo'
    }
  } else {
    statusActivity = 'done'
  }

  return statusActivity
}

const updateStatusUser = async (lead, statusActivity) => {
  try {
    const updatedLead = await userDB.update(lead._id, { statusActivity }, false)
    emitLead(updatedLead)
  } catch (error) {
    console.log('error update user', lead, statusActivity, error)
  }
}

const emitLead = lead => {
  if (lead.assessor) {
    const io = getSocket()
    io.to(lead.assessor.ref).emit('lead', lead)
  }
}

const sendNotification = async call => {
  const date = getFullDate(call)
  const data = {
    assigned: call.assigned.ref,
    linked: call.linked.ref,
    type: 'Llamada',
    typeRef: call._id,
    title: `Llamar a ${call.linked.names}`,
    content: `Se programo una llamada a ${
      call.linked.names
    } para ${date.calendar()}.`
  }
  try {
    const noti = await notificationDB.create(data)
    emitNotification(noti)
  } catch (error) {
    console.log('error create noti', data, error)
  }
}

const emitNotification = notification => {
  if (notification.assigned) {
    const io = getSocket()
    io.to(notification.assigned).emit('notification', notification)
  }
}

const getFullDate = call => {
  const singleDate = moment(call.date)
    .utc()
    .format('YYYY-MM-DD')
  const fullDate = singleDate + ' ' + call.hour
  return moment(fullDate, 'YYYY-MM-DD HH:mm')
}

module.exports = {
  countDocuments,
  listCalls,
  createCall,
  updateCall,
  detailCall,
  deleteCall,
  getDelayCalls
}
