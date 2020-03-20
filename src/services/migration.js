'use strict'

const toSlug = require('slug')
const cheerio = require('cheerio')
const moment = require('moment-timezone')
const { downloadFile } = require('utils/files/save')
const {
  userDB,
  categoryDB,
  courseDB,
  agreementDB,
  progressDB,
  metaDB
} = require('../db')
const { createUser } = require('./user')

const migrateTeachers = async data => {
  const promises = data.map(async item => {
    const photo = await downloadFile(
      item.photo,
      '/users',
      item.username + '.png'
    )
    const teacher = {
      ...item,
      country: 'Perú',
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
  const promises = data.map(async item => {
    const slug = toSlug(item.name, { lower: true })
    const image = await downloadFile(
      item.image,
      '/agreements',
      'image-' + slug + '.png'
    )
    const agreementData = {
      ...item,
      institution: item.name,
      image,
      slug
    }
    try {
      const agreement = await agreementDB.create(agreementData)
      return agreement
    } catch (error) {
      error.agreement = data.name
      return error
    }
  })

  const agreements = await Promise.all(promises)
  return agreements
}

const createAdmins = async () => {
  createUser({
    personalInfo: {
      names: 'Carlos Plasencia',
      email: 'carlos@eai.edu.pe',
      mobile: '942254876'
    },
    username: 'carlos',
    password: '123456',
    role: 'admin'
  })
  createUser({
    personalInfo: {
      names: 'Julio Grados',
      email: 'julio@eai.edu.pe',
      mobile: '999999991'
    },
    username: 'julio',
    password: '123456',
    role: 'admin'
  })
  createUser({
    personalInfo: {
      names: 'Juan Pino',
      email: 'juan@eai.edu.pe',
      mobile: '999999992'
    },
    username: 'juan',
    password: '123456',
    role: 'admin'
  })
  createUser({
    personalInfo: {
      names: 'Asesor',
      email: 'asesor@eai.edu.pe',
      mobile: '999999993'
    },
    username: 'asesor',
    password: '123456',
    role: 'assessor'
  })
}

const createProgress = async () => {
  const data = [
    {
      key: 'initial',
      pipes: ['sales'],
      name: 'Prospecto',
      order: 1
    },
    {
      key: 'progress',
      pipes: ['sales'],
      name: 'No Contesto',
      order: 2
    },
    {
      key: 'progress',
      pipes: ['sales'],
      name: 'Si contesto',
      order: 3
    },
    {
      key: 'progress',
      pipes: ['sales'],
      name: 'Confirmar',
      order: 4
    },
    {
      key: 'won',
      pipes: ['accounting', 'sales'],
      name: 'Canados',
      order: 5
    },
    {
      key: 'lost',
      pipes: ['sales'],
      name: 'Perdidos',
      order: 6
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Cuenta',
      order: 7
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Recibo',
      order: 8
    }
  ]
  data.forEach(progress => {
    progressDB.create(progress)
  })
}

const createMeta = async () => {
  metaDB.create({
    domain: 'https://www.eai.edu.pe',
    title: 'Escuela Americana de Innovación',
    description:
      'Institución líder en educación de formación continua en el Perú, que brinda cursos de especialización para cada profesional.',
    pages: [
      {
        name: 'Cursos',
        root: '/cursos/[slug]',
        title: '{{name}} - Escuela Americana de Innovación',
        description:
          '✅ Certificado en {{shortName}}  ✅ impreso por {{academicHours}} horas académicas. Metodología 100% virtual. Plana docente de las mejores universidades del Perú.'
      }
    ],
    address: {
      type: 'PostalAddress',
      street: 'Av. José de la Riva Agüero 2092, San Miguel',
      locality: 'Lima',
      postalCode: 15088,
      country: 'PE'
    },
    og: {
      title: 'Escuela Americana de Innovación',
      description:
        'Institución líder en educación de formación continua en el Perú, que brinda cursos de especialización para cada profesional.',
      url: 'https://www.eai.edu.pe/',
      siteName: 'https://www.eai.edu.pe/'
    },
    phone: 997314658,
    themeColor: '#0e61ee'
  })
}

const migrateCourses = async (
  dataCourse,
  dataTeachers,
  dataExtra,
  dataAgreements
) => {
  createAdmins()
  createProgress()
  createMeta()

  const categoriesName = []
  const data = dataCourse.map(element => {
    const extra = dataExtra.find(item => {
      return (
        item.slug.trim() === element.slug.trim() ||
        item.name.trim() === element.name.trim()
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

    return element
  })

  console.time('teachers')
  const teachers = await migrateTeachers(dataTeachers)
  console.timeEnd('teachers')
  console.time('agreements')
  const agreements = await migrateAgrements(dataAgreements)
  console.timeEnd('agreements')
  console.time('categories')
  const categories = await migrateCategories(categoriesName)
  console.timeEnd('categories')

  console.time('courses')
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
        const id = item.brochureDrive && item.brochureDrive.split('id=')[1]
        const url = `https://drive.google.com/u/0/uc?id=${id}&export=download`
        brochure = `/brochure/brochure-${item.slug}.pdf`
        /* if (id) {
          brochure = await downloadFile(
            url,
            '/brochure',
            'brochure-' + item.slug + '.pdf'
          )
        } */
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        //console.log('error imagen', error)
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
        console.log('acabe -> ', course.name)
        return course
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        console.log('error curso', error)
        return error
      }
    })
  )
  console.timeEnd('courses')
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
