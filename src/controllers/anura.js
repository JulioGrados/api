'use strict'

const { updateStatusCall } = require('../services/call')

const eventWebhook = async (req, res) => {
  //
  const event = req.body
  
  try {
    console.log('event', event)
    await updateStatusCall(event)
  } catch (error) {
    console.log('error al actualizar el stado call', event, error)
  }
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebhook
}
