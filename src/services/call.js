'use strict'

const { callDB, notificationDB, dealDB } = require('../db')
const moment = require('moment-timezone')
const { getSocket } = require('../lib/io')

const { getNewActivityState, getFullDate } = require('utils/functions/call')

const listCalls = async params => {
  const calls = await callDB.list(params)
  return calls
}

const createCall = async (body, loggedCall) => {
  await validateExistCall(body)
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
      deal: { $exists: true }
    },
    populate: {
      path: 'deal',
      match: { statusActivity: { $ne: 'delay' } },
      select: 'statusActivity'
    }
  })

  calls.map(async call => {
    if (call.deal) {
      await updateUserStateFromCall(call, true)
    }
  })
}

const updateUserStateFromCall = async (call, emit) => {
  let deal = await getDealFromCall(call)
  const statusActivity = getNewActivityState(call)
  if (statusActivity !== deal.statusActivity) {
    if (statusActivity === 'delay') {
      sendNotification(call, deal)
    }
    deal = updateStatusDeal(deal, statusActivity)
  }
  if (emit) {
    emitCall(call, deal)
  }
  return deal
}

const getDealFromCall = async call => {
  let deal
  if (call.deal && call.deal.statusActivity) {
    deal = call.deal
  } else {
    deal = await dealDB.detail({
      query: { _id: call.deal },
      select: 'statusActivity'
    })
  }
  return deal
}

const updateStatusDeal = async (deal, statusActivity) => {
  try {
    const updatedDeal = await dealDB.update(deal._id, { statusActivity }, false)
    emitDeal(updatedDeal)
  } catch (error) {
    console.log('error update user', deal, statusActivity, error)
  }
}

const emitDeal = deal => {
  if (deal.assessor) {
    const io = getSocket()
    io.to(deal.assessor.ref).emit('deal', deal)
  }
}

const emitCall = call => {
  if (call.assigned) {
    const io = getSocket()
    io.to(call.assigned.ref).emit('call', call)
  }
}

const sendNotification = async (call, deal) => {
  const date = getFullDate(call)
  const data = {
    assigned: call.assigned.ref,
    linked: call.linked.ref,
    deal: deal._id,
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

const validateExistCall = async body => {
  if (body.isCompleted === true) {
    return true
  }
  try {
    const exist = await callDB.list({
      query: {
        isCompleted: { $ne: true },
        'linked.ref': body.linked.ref,
        deal: body.deal
      },
      select: '_id'
    })
    console.log('exist', exist)
    if (exist.length > 0) {
      const error = {
        status: 402,
        message:
          'No puedes tener más de una llamada pendiente, completa las demas para poder crear una nueva.'
      }
      throw error
    } else {
      return true
    }
  } catch (error) {
    throw error
  }
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
