'use strict'

const { certificateDB } = require('../db')
const { saveFile, saveCustom, saveFileCreateName } = require('utils/files/save')
const { courseDB, dealDB } = require('db/lib')

const listCertificates = async params => {
  const certificates = await certificateDB.list(params)
  return certificates
}

const listDealAgreements = async (params, loggedUser) => {
  try {
    const courseFind = await courseDB.detail({ query: { _id: params['course.ref'] } })
    const certificates = await certificateDB.list({ query: { 'course.ref': courseFind } })
    const migrate = certificates.map( async certificate => {
      // console.log('certificate', certificate)
      let certificateUpdate
      const deals = await dealDB.list({
        query: {
          students: {
            $elemMatch: {
              'student.ref': certificate.linked.ref.toString()
            }
          }
        },
        populate: [ 'client']
      })
      let deal
      deals.find( element => {
        const students = element.students
        const student = students.find(item => item.student.ref.toString() === certificate.linked.ref.toString())
        const courses = student.courses
        const filtered = courses.find(item => item.ref.toString() === courseFind._id.toString())
        if (filtered && filtered.agreement) {
          deal = filtered
        }
      })

      if (!deal) {
        certificateUpdate = await certificateDB.update( certificate._id.toString(), {
          agreement: {
            institution: courseFind.agreement.institution,
            ref: courseFind.agreement.ref
          },
          modality: 'Físico'
        })
        console.log('no entro', certificateUpdate)
      } else {
        certificateUpdate = await certificateDB.update( certificate._id.toString(), {
          agreement: {
            institution: deal.agreement.institution,
            ref: deal.agreement.ref
          },
          modality: deal.modality ? deal.modality : 'Físico'
        })
        console.log('entro', certificateUpdate)
      }

      return await certificateDB.detail({
        query: { _id: certificateUpdate._id.toString() },
        populate: ['linked.ref', 'course.ref', 'agreement.ref']
      })
    })
    const results = await Promise.all(migrate.map(p => p.catch(e => e)))
    return results
  } catch (error) {
    throw error
  }
}

const createAdminCertificate = async (body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      const route = await saveFileCreateName(files[label], '/certificates')
      body[label] = route
    }
  }
  const certficate = await certificateDB.create(body)
  return certficate
}

const updateAdminCertificate = async (certficateId, body, files, loggedUser) => {
  if (files) {
    for (const label in files) {
      // const certi = await certificateDB.detail({ query: { _id: certficateId }, populate: ['linked.ref', 'course.ref'] })
      const route = await saveFileCreateName(files[label], '/certificates')
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
  listDealAgreements,
  createCertificate,
  createAdminCertificate,
  updateAdminCertificate,
  updateCertificate,
  detailCertificate,
  deleteCertificate
}
