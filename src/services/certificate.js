'use strict'

const { certificateDB } = require('../db')

const listCertificates = async params => {
  const certificates = await certificateDB.list(params)
  return certificates
}

const createCertificate = async (body, loggedUser) => {
  const certificate = await certificateDB.create(body)
  return certificate
}

const updateCertificate = async (certificateId, body, loggedUser) => {
  const certificate = await certificateDB.update(certificateId, body)
  return certificate
}

const detailCertificate = async params => {
  const certificate = await certificateDB.detail(params)
  return certificate
}

const deleteCertificate = async (certificateId, loggedUser) => {
  const certificate = await certificateDB.remove(certificateId)
  return certificate
}

const countDocuments = async params => {
  const count = await certificateDB.count(params)
  return count
}

module.exports = {
  countDocuments,
  listCertificates,
  createCertificate,
  updateCertificate,
  detailCertificate,
  deleteCertificate
}
