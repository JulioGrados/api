'use strict'

const service = require('../services/claim')

const listClaims = async (req, res) => {
  const claims = await service.listClaims(req.query)
  return res.status(200).json(claims)
}

const createClaim = async (req, res) => {
  console.log('req.body', req.body)
  console.log('req.claim', req.claim)
  try {
    const claim = await service.createClaim(req.body, req.claim)
    console.log('claim', claim)
    return res.status(201).json(claim)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateClaim = async (req, res) => {
  const claimId = req.params.id
  try {
    const claim = await service.updateClaim(
      claimId,
      req.body,
      req.claim
    )
    return res.status(200).json(claim)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailClaim = async (req, res) => {
  const claimId = req.params.id
  const params = req.query
  if (params.query) {
    params.query._id = claimId
  } else {
    params.query = {
      _id: claimId
    }
  }

  try {
    const claim = await service.detailClaim(params)
    return res.status(200).json(claim)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteClaim = async (req, res) => {
  const claimId = req.params.id
  try {
    const claim = await service.deleteClaim(claimId, req.claim)
    return res.status(201).json(claim)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const countDocuments = async (req, res) => {
  const count = await service.countDocuments(req.query)
  return res.json(count)
}

module.exports = {
  countDocuments,
  listClaims,
  createClaim,
  updateClaim,
  detailClaim,
  deleteClaim
}
