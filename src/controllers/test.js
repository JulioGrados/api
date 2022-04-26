'use strict'

const { api } = require('utils/functions/zadarma')
const services = require('../services/test')

const getLessions = async (req, res, next) => {
  try {
    const lessions = await services.getLessions(req.body)
    return lessions
  } catch (error) {
    next(error)
  }
}

const getMain = async (req, res, next) => {
  // console.log('req.query.zd_echo', req.query.zd_echo)
  // if (req.query.zd_echo) {res.send(req.query.zd_echo);}
  // else { res.send("Hi"); }
  console.log('req - zadarma', req.body)
  // let balance = await api({
  //   api_method: '/v1/tariff/',
  //   params: {
  //   }
  // })
  // console.log('balance', balance)
  // res.send(balance.data)
}

const getBalance = async (req, res, next) => {
  console.log('holaaa')
  // let balance = await api({
  //   http_method: 'POST',
  //   api_method: '/v1/sms/send/',
  //   params: {
  //     number: '+51984480719',
  //     message: 'Ya no comas huevo en el desayuno, laganas'
  //   }
  // })
  const balance = await api({
    api_method: '/v1/webrtc/get_key/',
    params: {
        sip: '100'
        // to: '+51949002838'
    }
  });
  console.log('balance', balance.data)
  res.send(balance.data)
}


module.exports = {
  getLessions,
  getMain,
  getBalance
}