'use strict'

const { certificateDB } = require('../db')
const { saveFile, saveCustom } = require('utils/files/save')

const listCertificates = async params => {
  const certificates = await certificateDB.list(params)
  return certificates
}

const createAdminCertificate = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFile(files[label], '/certificates')
      body[label] = route
    }
  }
  const certficate = await certificateDB.create(body)
  return certficate
}

const updateAdminCertificate = async (certficateId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const certi = await certificateDB.detail({ query: { _id: certficateId }, populate: ['linked.ref', 'course.ref'] })
      const route = await saveCustom(files[label], '/certificates', certi.course.ref.shortName, certi.linked.ref.names, certi.shortCode)
      body[label] = route
    }
  }
  
  const certficate = await certificateDB.update(certficateId, body)
  const certificateDetail = await certificateDB.detail({ query: { _id: certficate._id }, populate: ['linked.ref', 'course.ref'] })
  return certificateDetail
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
  createAdminCertificate,
  updateAdminCertificate,
  updateCertificate,
  detailCertificate,
  deleteCertificate
}
