'use strict'

//const service = require('../services/course')

const eventWebhook = async (req, res) => {
  //
  const events = req.body
  events.forEach(function (event) {
    // Here, you now have each event and can process them how you like
    console.log(event)
  })
  console.log('resived')
  return res.status(200)
}

module.exports = {
  eventWebhook
}
