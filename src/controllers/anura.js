'use strict'

const { updateStatusCall, updateStrangerCall } = require('../services/call')

const eventWebhook = async (req, res) => {
  //
  const event = req.body
  
  try {
    console.log('event', event)
    await updateStatusCall(event)
  } catch (error) {
    const stranger = event && event.direction && await updateStrangerCall(event)
    console.log('error al actualizar el stado call', stranger, event)
  }
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebhook
}
