'use strict'

const service = require('../services/certificate')

const listCertificates = async (req, res) => {
  const certificates = await service.listCertificates(req.query)
  return res.status(200).json(certificates)
}

const createCertificate = async (req, res) => {
  try {
    const certificate = await service.createCertificate(req.body, req.user)
    return res.status(201).json(certificate)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const updateCertificate = async (req, res) => {
  const certificateId = req.params.id
  try {
    const certificate = await service.updateCertificate(
      certificateId,
      req.body,
      req.user
    )
    return res.status(200).json(certificate)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailCertificate = async (req, res) => {
  const certificateId = req.params.id
  const params = req.query
  
  if (params.query) {
    params.query._id = certificateId
  } else {
    params.query = {
      _id: certificateId
    }
  }

  try {
    const certificate = await service.detailCertificate(params)
    return res.status(200).json(certificate)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const detailCertificateOpen = async (req, res) => {
  const certificateId = req.params.id
  const params = req.query
  if (certificateId) {
    if (params.query) {
      params.query._id = certificateId
    } else {
      params.query = {
        _id: certificateId
      }
    }
  }

  try {
    const certificate = await service.detailCertificate(params)
    return res.status(200).json(certificate)
  } catch (error) {
    return res.status(error.status || 500).json(error)
  }
}

const deleteCertificate = async (req, res) => {
  const certificateId = req.params.id
  try {
    const certificate = await service.deleteCertificate(certificateId, req.user)
    return res.status(201).json(certificate)
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
  listCertificates,
  createCertificate,
  updateCertificate,
  detailCertificate,
  detailCertificateOpen,
  deleteCertificate
}
