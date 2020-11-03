'use strict'

const { claimDB } = require('../db')

const listClaims = async params => {
  const claims = await claimDB.list(params)
  return claims
}

const createClaim = async (body, loggedClaim) => {
  const claim = await claimDB.create(body)
  return claim
}

const updateClaim = async (claimId, body, loggedClaim) => {
  const claim = await claimDB.update(claimId, body)
  return claim
}

const detailClaim = async params => {
  const claim = await claimDB.detail(params)
  return claim
}

const deleteClaim = async (claimId, loggedClaim) => {
  const claim = await claimDB.remove(claimId)
  return claim
}

const countDocuments = async params => {
  const count = await claimDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listClaims,
  createClaim,
  updateClaim,
  detailClaim,
  deleteClaim
}
