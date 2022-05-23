'use strict'

const service = require('../services/company')
const { paymentLeadGods } = require('utils/functions/leadgods')

const listLeadgods = async (req, res) => {
  
}

const eventLeadgods = async (req, res) => {
  
}

const createLeadgods = async (req, res, next) => {
  // const body = req.body.data ? JSON.parse(req.body.data) : req.body
  // const file = req.files && req.files.image
  // try {
  //   const company = await service.createLeadgods(body, file, req.user)
  //   return res.status(201).json(company)
  // } catch (error) {
  //   console.log(error)
  //   next(error)
  // }
  // const data = req.body
  
  // try {
  //   const resp = await paymentLeadGods(data)
  //   console.log('resp', resp.data)
  //   return res.status(200).json(resp.data)
  // } catch (error) {
  //   next(error)
  // }
  // console.log('req', req)
}

const detailLeadgods = async (req, res, next) => {
  
}

const deleteLeadgods = async (req, res, next) => {
  
}

const countDocuments = async (req, res) => {
  
}

module.exports = {
  countDocuments,
  listLeadgods,
  eventLeadgods,
  createLeadgods,
  detailLeadgods,
  deleteLeadgods
}
