'use strict'

const { callDB, userDB } = require('../db')
const moment = require('moment-timezone')
const { getSocket } = require('../lib/io')

const listCalls = async params => {
  const calls = await callDB.list(params)
  return calls
}

const createCall = async (body, loggedCall) => {
  const call = await callDB.create(body)
  updateUserState(call)
  return call
}

const updateCall = async (callId, body, loggedCall) => {
  const call = await callDB.update(callId, body)
  updateUserState(call)
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
      await updateUserState(call)
    }
  })
}

const updateUserState = async call => {
  let lead
  if (call.linked.ref && call.linked.ref.statusActivity) {
    lead = call.linked.ref
  } else {
    lead = await userDB.detail({
      query: { _id: call.linked.ref },
      select: 'statusActivity'
    })
  }
  let { statusActivity } = lead
  if (!call.isCompleted) {
    const date =
      moment(call.date)
        .utc()
        .format('YYYY-MM-DD') +
      ' ' +
      call.hour
    if (moment().isAfter(moment(date, 'YYYY-MM-DD HH:mm'))) {
      statusActivity = 'delay'
    } else {
      statusActivity = 'todo'
    }
  } else {
    statusActivity = 'done'
  }
  if (statusActivity !== lead.statusActivity) {
    const updatedLead = await userDB.update(lead._id, { statusActivity }, false)
    const io = getSocket()
    if (updatedLead.assessor) {
      io.to(updatedLead.assessor.ref).emit('lead', updatedLead)
    }
    return updatedLead
  }
  return lead
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
