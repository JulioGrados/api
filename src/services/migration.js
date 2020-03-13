'use strict'

const toSlug = require('slug')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const { downloadFile } = require('utils/files/save')
const { userDB, categoryDB, courseDB, agreementDB } = require('../db')

const migrateTeachers = async data => {
  const promises = data.map(async item => {
    const photo = await downloadFile(item.photo, '/users')
    const teacher = {
      ...item,
      photo
    }
    try {
      const user = await userDB.create(teacher)
      return user
    } catch (error) {
      error.teacher = data.username
      return error
    }
  })

  const users = await Promise.all(promises)
  return users
}

const migrateCategories = async data => {
  const categories = await Promise.all(
    data.map(async item => {
      const slug = toSlug(item.name || '', { lower: true })
      try {
        const category = await categoryDB.detail({ query: { slug } })
        return category
      } catch (error) {
        if (error.status === 404) {
          const category = await categoryDB.create({
            ...item,
            slug
          })
          return category
        } else {
          throw error
        }
      }
    })
  )

  return categories
}

const migrateAgrements = async data => {
  const agreements = await Promise.all(
    data.map(async item => {
      const slug = toSlug(item.name || '', { lower: true })
      try {
        const agreement = await agreementDB.detail({ query: { slug } })
        return agreement
      } catch (error) {
        if (error.status === 404) {
          const agreement = await agreementDB.create({
            institution: item.name,
            slug
          })
          return agreement
        } else {
          throw error
        }
      }
    })
  )

  return agreements
}

const migrateCourses = async (dataCourse, dataExtra) => {
  const categoriesName = []
  const agreementName = []
  const data = dataCourse.map(element => {
    const extra = dataExtra.find(item => {
      return (
        item.slug === element.slug || item.name.trim() === element.name.trim()
      )
    })
    element = {
      ...element,
      ...extra
    }
    if (!extra) {
      console.log('no extra', element.name)
    }
    if (!categoriesName.find(item => item.name === element.category)) {
      if (element.category) {
        categoriesName.push({ name: element.category })
      }
    }
    if (!agreementName.find(item => item.name === element.agreement)) {
      if (element.agreement) {
        agreementName.push({ name: element.agreement })
      }
    }
    return element
  })

  const agreements = await migrateAgrements(agreementName)
  const categories = await migrateCategories(categoriesName)
  const teachers = await userDB.list({ query: { role: 'teacher' } })

  const courses = await Promise.all(
    data.map(async item => {
      let image, shortimage, brochure
      try {
        image = await downloadFile(
          item.image,
          '/courses',
          'image-' + item.slug + '.png'
        )
        shortimage = await downloadFile(
          item.shortImage,
          '/courses',
          'shortimage-' + item.slug + '.png'
        )
        brochure = await downloadFile(
          item.brochureDrive,
          '/brochure',
          'brochure-' + item.slug + '.pdf'
        )
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        return error
      }
      const published = moment(item.published, 'YYYY-MM-DD')
      const categoryItem = categories.find(
        cate => toSlug(cate.name || '') === toSlug(item.category)
      )
      if (!categoryItem) {
        const error = {
          status: 500,
          message: 'No se enconto la categoria',
          course: item.name,
          slug: item.slug
        }
        return error
      }
      const category = {
        ...categoryItem.toJSON(),
        ref: categoryItem._id
      }
      const agreementItem = agreements.find(agree => {
        return (
          agree.institution &&
          toSlug(agree.institution || '') === toSlug(item.agreement || '')
        )
      })
      let agreement
      if (agreementItem) {
        agreement = {
          ...agreementItem.toJSON(),
          ref: agreementItem._id
        }
      }
      const authorItem = teachers.find(
        teacher => teacher.username === item.author
      )

      if (!authorItem) {
        const error = {
          status: 404,
          message: 'No se enconto el author',
          course: item.name,
          slug: item.slug,
          author: item.author
        }
        return error
      }
      const author = {
        ...authorItem.toJSON(),
        names: authorItem.personalInfo.names,
        email: authorItem.personalInfo.email,
        ref: authorItem._id
      }

      const descriptionGeneral = getDescriptionGeneral(item.content)
      const lessons = getModules(item.content)

      const courseData = {
        ...item,
        image,
        shortimage,
        category,
        agreement,
        author,
        published,
        descriptionGeneral,
        lessons,
        brochure,
        teachers: [author]
      }
      try {
        const course = await courseDB.create(courseData)
        return course
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        return error
      }
    })
  )

  return { categories, courses }
}

const getDescriptionGeneral = content => {
  const $ = cheerio.load(content)
  let description = ''
  $('.course-body-about')
    .first()
    .children()
    .filter('p')
    .each((i, element) => {
      const text = $(element).text()
      description += (description && '\n') + text
    })

  return description
}

const getModules = content => {
  const lessons = []
  const $ = cheerio.load(content)
  const about = $('.course-body-about')
  const temary = about['3']
  const resume = $(temary)
    .children()
    .filter('div')

  $(resume['0'])
    .children()
    .each((i, e1) => {
      const eTitle = $(e1).children()['0']
      const title = $(eTitle).text()
      const lesson = {
        name: title,
        slug: toSlug(title, { lower: true }),
        chapters: []
      }
      $(e1)
        .children()
        .each((i2, e2) => {
          if (i2 > 0) {
            const chap = $(e2)
              .children()
              .first()
              .text()
            const chapter = {
              name: chap.trim(),
              slug: toSlug(chap, { lower: true })
            }
            lesson.chapters.push(chapter)
          }
        })

      lessons.push(lesson)
    })

  return lessons
}

module.exports = {
  migrateTeachers,
  migrateCourses,
  migrateCategories
}
