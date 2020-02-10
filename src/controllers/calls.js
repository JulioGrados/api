'use strict'

const serviceCall = require('../services/call')

const listCalls = async (req, res) => {
  const calls = await serviceCall.listCalls(req.query)
  return res.status(200).json(calls)
}

const createCall = async (req, res) => {
  try {
    const call = await serviceCall.createCall(req.body, req.call)
    return res.status(201).json(call)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateCall = async (req, res) => {
  const callId = req.params.id
  try {
    const call = await serviceCall.updateCall(callId, req.body, req.call)
    return res.status(200).json(call)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailCall = async (req, res) => {
  const callId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = callId
  } else {
    params.query = {
      _id: callId
    }
  }

  try {
    const call = await serviceCall.detailCall(params)
    return res.status(200).json(call)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteCall = async (req, res) => {
  const callId = req.params.id
  try {
    const call = await serviceCall.deleteCall(callId, req.call)
    return res.status(201).json(call)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

module.exports = {
  listCalls,
  createCall,
  updateCall,
  detailCall,
  deleteCall
}
