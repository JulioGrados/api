'use strict'

const { callDB, notificationDB, dealDB } = require('../db')
const moment = require('moment-timezone')
const CustomError = require('custom-error-instance')

const { getSocket } = require('../lib/io')
const { getNewActivityState, getFullDate } = require('utils/functions/call')
const { userDB } = require('db/lib')

const listCalls = async params => {
  console.log('--------------------------------------------------------')
  console.log('LLAMADAS')
  console.log('--------------------------------------------------------')
  const calls = await callDB.list(params)
  return calls
}

const createCall = async (body, loggedCall) => {
  await validateExistCall(body)
  const call = await callDB.create(body)
  const deal = await updateUserStateFromCall(call)
  // emitDeal(deal)
  return call
}

const updateCall = async (callId, body, loggedCall) => {
  const call = await callDB.update(callId, body)
  const deal =  await updateUserStateFromCall(call)
  // emitDeal(deal)
  return call
}


const updateStatusCall = async (body, loggedCall) => {
  const deal = await searchDeal(body)
  const dataCall = await prepareCall(body, deal)
  const call = await callDB.create(dataCall)
  emitCall(call)
  return call
}

const updateStrangerCall = async (body) => {
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : called
  const dataCall = {
    direction: body.direction,
    cdrid: body.cdrid,
    callingname: body.callingname,
    calling: calling,
    called: phone,
    status: getStatusCalls(body.status),
    duration: body.duration,
    billseconds: body.billseconds,
    price: body.price,
    isCompleted: true,
    service: true,
    hour: moment(body.dialtime)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.dialtime)
  }

  const call = await callDB.create(dataCall)
  return call
}

const popUpCall = async (body, loggedCall) => {
  // const assessors = await userDB.list({
  //   query: {
  //     roles: 'Asesor'
  //   }
  // })

  // const receptionist = assessors.find(assessor => assessor.roles && assessor.roles.includes('Recepcionista') === true)
  const receptionist = await userDB.detail({
    query: {
      roles: 'Recepcionista'
    }
  })
  // console.log('receptionist', receptionist)
  // Asesor que este activo de acuerdo al trato
  // Activo, mandar la notificación
  // Inactivo o no tiene trato a recepcionista 
  
  try {
    const deal = await searchDeal(body)
    const dataDeal = {
      ...deal.toJSON(),
      exist: true
    }

    // const assigend = deal && deal.assessor && deal.assessor.ref
    // const assessor = assigend && assessors.find(item => item._id.toString() === assigend.toString())

    // console.log('assigend', assigend)
    // console.log('assessor', assessor)

    // if ( assessor && assessor.status ) {
    //   emitPopUp(dataDeal, assessor)
    // } else {
    //   emitPopUp(dataDeal, receptionist)
    // }
    emitPopUp(dataDeal, receptionist)
    return deal
  } catch (error) {
    const dataDeal = {
      ...body,
      exist: false
    }
    emitPopUp(dataDeal, receptionist)
  }
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

const prepareCall = async (body, deal) => {
  const lastCall = await callDB.list({
    query: { deal: deal._id },
    sort: '-createdAt'
  })
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : called
  
  const number = lastCall ? lastCall.length + 1 : 1
  const dataCall = {
    name: `Llamada ${number}`,
    number,
    direction: body.direction,
    cdrid: body.cdrid,
    callingname: body.callingname,
    calling: calling,
    called: phone,
    status: getStatusCalls(body.status),
    duration: body.duration,
    billseconds: body.billseconds,
    price: body.price,
    isCompleted: true,
    service: true,
    hour: moment(body.dialtime)
      .add(1, 'minutes')
      .format('HH:mm'),
    date: moment(body.dialtime),
    assigned: deal.assessor,
    linked: {
      names: deal.client.names,
      ref: deal.client._id
    },
    deal: deal._id
  }
  return dataCall
}

const searchDeal = async (body) => {
  const called = body.called
  const calling = body.calling
  const phone = body.direction === 'OUT' ? called.substring(4, called.length) : calling

  try {
    const user = await userDB.detail({ query: { mobile: phone } })
    const deal = await dealDB.detail({ query: { client: user._id }, populate: { path: 'client' } })
    return deal
  } catch (error) {
    throw error
  }
}

const getStatusCalls = (event) => {
  
  switch (event) {
    case 'ANSWER':
      return 'Contestó'
    case 'CANCEL':
      return 'No contestó'
    case 'CONGESTION':
      return 'Congestion'
    default:
      return event
  }
}

const getDelayCalls = async () => {
  // console.log('start', moment().subtract(1, 'days').endOf('day'))
  // console.log('start', moment().endOf('day'))
  const calls = await callDB.list({
    query: {
      isCompleted: false,
      // date: {
      //   $gte: moment().subtract(2, 'days').startOf('day'),
      //   $lte: moment().startOf('day')
      // },
      deal: { $exists: true }
    },
    populate: {
      path: 'deal',
      match: { statusActivity: { $ne: 'delay' } },
      select: 'statusActivity'
    }
  })

  // console.log('calls', calls)

  calls.map(async call => {
    if (call.deal) {

      await updateUserStateFromCall(call, true)
    }
  })
}

const updateUserStateFromCall = async (call, emit) => {
  let deal = await getDealFromCall(call)
  // console.log('deal', deal)
  const statusActivity = getNewActivityState(call)
  // console.log('statusActivity', statusActivity)
  // console.log('deal.statusActivity', deal.statusActivity)
  if (statusActivity !== deal.statusActivity) {
    // if (statusActivity === 'delay') {
    //   sendNotification(call, deal)
    // }
    deal = await updateStatusDeal(deal, statusActivity)
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
    return updatedDeal
  } catch (error) {
    console.log('error update user', deal, statusActivity, error)
  }
}

const emitDeal = deal => {
  if (deal.assessor) {
    console.log('llamado deal')
    const io = getSocket()
    io.to(deal.assessor.ref).emit('deal', deal)
  }
}

const emitCall = call => {
  if (call.assigned) {
    console.log('llamado call')
    const io = getSocket()
    io.to(call.assigned.ref).emit('call', call)
  }
}

const emitPopUp = (deal, assigned) => {
  if (assigned) {
    console.log('llamada entrante')
    const io = getSocket()
    io.to(assigned._id).emit('popup', deal)
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
  // if (body.isCompleted === true) {
  //   return true
  // }
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
      const InvalidError = CustomError('InvalidError', { message: 'No puedes tener más de una llamada pendiente, completa las demas para poder crear una nueva.', code: 'EINVLD' }, CustomError.factory.expectReceive);
      throw new InvalidError()
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
  popUpCall,
  getDelayCalls,
  updateStatusCall,
  updateStrangerCall
}
