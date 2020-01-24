'use strict'

const { callDB } = require('../db')

const listCalls = async (params) => {
  const calls = await callDB.list(params)
  return calls
}

const createCall = async (body, loggedCall) => {
  const call = await callDB.create(body)
  return call
}

const updateCall = async (callId, body, loggedCall) => {
  const call = await callDB.update(callId, body)
  return call
}

const detailCall = async (params) => {
  const call = await callDB.detail(params)
  return call
}

const deleteCall = async (callId, loggedCall) => {
  const call = await callDB.remove(callId)
  return call
}

module.exports = {
  listCalls,
  createCall,
  updateCall,
  detailCall,
  deleteCall
}
