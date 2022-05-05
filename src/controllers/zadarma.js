'use strict'

const { updateStatusZadarmaCall, updateStrangerZadarmaCall, popUpZadarmaCall } = require("../services/call")

const eventWebHookZadarma = async (req, res, next) => {
  // console.log('req.query.zd_echo', req.query.zd_echo)
  // if (req.query.zd_echo) {res.send(req.query.zd_echo);}
  // else { res.send("Hi"); }
  console.log('req - zadarma', req.body)
  const event = req.body
  if (event.event === 'NOTIFY_OUT_END' && event.destination ) {
    try {
      console.log('event', event)
      await updateStatusZadarmaCall(event)
    } catch (error) {
      const stranger = event && event.direction && await updateStrangerZadarmaCall(event)
      console.log('error al actualizar el stado caller', stranger, event)
    }  
  } else if (event.event === 'NOTIFY_START' && event.caller_id && !event.destination ) {
    try {
      await popUpZadarmaCall(event)
    } catch (error) {
      console.log('error al actualizar el stado calling', error)
    }
  } 
  return res.status(200).json({ success: true })
}

module.exports = {
  eventWebHookZadarma
}