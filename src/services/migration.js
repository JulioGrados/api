'use strict'

const toSlug = require('slug')
const cheerio = require('cheerio')
const _ = require('lodash')
const moment = require('moment-timezone')
const { downloadFile } = require('utils/files/save')
const { compareOnlySimilarity } = require('utils/functions/text')
const { sqlConsult } = require('utils/functions/sql')
const { calculateProm } = require('utils/functions/enrol')
const { createUser } = require('./user')
const {
  userDB,
  categoryDB,
  courseDB,
  agreementDB,
  progressDB,
  metaDB,
  enrolDB,
  examDB,
  taskDB,
  certificateDB,
  testimonyDB
} = require('../db')

const migrateTeachers = async data => {
  const promises = data.map(async item => {
    const photo = await downloadFile(
      item.photo,
      '/users',
      item.username + '.png'
    )
    const teacher = {
      ...item,
      names: item.personalInfo.names,
      email: item.personalInfo.email,
      role: undefined,
      roles: ['Docente'],
      country: 'Perú',
      photo
    }
    try {
      const user = await userDB.create(teacher)
      return user
    } catch (error) {
      error.teacher = data.username
      console.log('error', error, teacher)
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
    names: 'Carlos Plasencia',
    email: 'carlos@eai.edu.pe',
    mobile: '999999990',
    username: 'CarlosPlasencia',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Julio Grados',
    email: 'julio@eai.edu.pe',
    mobile: '999999991',
    username: 'JulioGrados',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Juan Pino',
    email: 'juan@eai.edu.pe',
    mobile: '999999992',
    username: 'JuanPino',
    password: '123456',
    roles: ['Asesor', 'Docente', 'Administrador']
  })
  createUser({
    names: 'Asesor',
    email: 'asesor@eai.edu.pe',
    mobile: '999999993',
    username: 'asesor',
    password: '123456',
    roles: ['Asesor']
  })
}

const createProgress = async () => {
  const data = [
    {
      key: 'initial',
      pipes: ['deals'],
      name: 'Prospecto',
      order: 1
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'No Contesto',
      order: 2
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'Si contesto',
      order: 3
    },
    {
      key: 'progress',
      pipes: ['deals'],
      name: 'Confirmar',
      order: 4
    },
    {
      key: 'won',
      pipes: ['accounting'],
      name: 'Nuevo',
      order: 5
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Cuenta',
      order: 6
    },
    {
      key: 'progress',
      pipes: ['accounting'],
      name: 'Recibo',
      order: 7
    }
  ]
  data.forEach(progress => {
    progressDB.create(progress)
  })
}

const createTestimonies = async () => {
  const data = [
    {
      firstName: 'Darwin Raúl',
      lastName: 'Huaman Hernandez',
      dni: 70393661,
      city: 'PISCO, ICA',
      rate: 5,
      comment:
        'Es una plataforma que deja muy satisfecho, depende también del ordenador donde desarrolles el curso, pero en general muy bueno eh aprendido muchísimo y me siento mas competente en el ámbito profesional donde me desarrollo.',
      course: {
        name: 'Curso profesional de excel',
        slug: 'excel'
      }
    },
    {
      firstName: 'Jesus Diogenes',
      lastName: 'Coronel Florindez',
      dni: 18144172,
      city: 'LIMA, LIMA',
      rate: 5,
      comment:
        'Muy buena información y casos. Altamente recomendable para quienes desean profundizar en el tema de las finanzas.',
      course: {
        name: 'Curso de Finanzas Corporativas',
        slug: 'finanzas-corporativas'
      }
    },
    {
      firstName: 'Charlie Jaime',
      lastName: 'Tocas Bringas',
      dni: 46846658,
      city: 'LIMA, LIMA',
      rate: 5,
      comment:
        'Este curso me ayudó a comprender mejor como se mueve y funciona el mundo de los recursos humanos y me aportó muchos conceptos que no había visto antes. También me permitió actualizarme al mostrarme las nuevas tendencias de este campo tan interesante e importante para las empresas, como lo es la gestión del talento humano.',
      course: {
        name: 'CURSO DE GESTIÓN DEL TALENTO HUMANO',
        slug: 'gestion-del-talento-humano'
      }
    }
  ]
  data.forEach(testimony => {
    testimonyDB.create(testimony)
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
  createTestimonies()

  const categoriesName = []
  const data = dataCourse.map(element => {
    const extra = dataExtra.find(item => {
      return (
        item.slug.trim() === element.slug.trim() ||
        item.name.trim() === element.name.trim()
      )
    })
    element = {
      ...extra,
      ...element
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
        image = `/courses/image-${item.slug}.png`
        shortimage = await downloadFile(
          item.shortImage,
          '/courses',
          'shortimage-' + item.slug + '.png'
        )
        shortimage = `/courses/shortimage-${item.slug}.png`
        const id = item.brochureDrive && item.brochureDrive.split('id=')[1]
        const url = `https://drive.google.com/u/0/uc?id=${id}&export=download`
        brochure = `/brochure/brochure-${item.slug}.pdf`
        if (id) {
          brochure = await downloadFile(
            url,
            '/brochure',
            'brochure-' + item.slug + '.pdf'
          )
        }
      } catch (error) {
        error.course = item.name
        error.slug = item.slug
        // console.log('error imagen', error)
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
        names: authorItem.names,
        email: authorItem.email,
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

const migrateMoodleCourses = async () => {
  const SQL_QUERY = 'SELECT id, fullname FROM mdl_course'

  const courses = await courseDB.list({})
  const dataCourses = await sqlConsult(SQL_QUERY)
  console.log(dataCourses)
  const newCourses = await Promise.all(
    dataCourses.map(async moodleCourse => {
      const course = courses.find(
        item => compareOnlySimilarity(item.name, moodleCourse.fullname) > 0.9
      )
      if (course) {
        const updatecourse = await courseDB.update(course._id, {
          moodleId: moodleCourse.id
        })
        return updatecourse
      } else {
        console.log('no se encontro', moodleCourse.fullname)
        return moodleCourse
      }
    })
  )

  return newCourses
}

const migrateUsersMoodle = async () => {
  const SQL_QUERY =
    'SELECT id, username, firstname, lastname, email, country, city FROM mdl_user WHERE deleted = 0'

  const dataUsers = await sqlConsult(SQL_QUERY)

  const users = await userDB.list({ select: 'email username roles' })

  const newUsers = await Promise.all(
    dataUsers.map(async (moodleUser, idx) => {
      const data = {
        moodleId: moodleUser.id,
        username: moodleUser.username,
        firstName: moodleUser.firstname,
        lastName: moodleUser.lastname,
        names: moodleUser.firstname + ' ' + moodleUser.lastname,
        email: moodleUser.email,
        country: moodleUser.country === 'PE' ? 'Perú' : '',
        city: moodleUser.city,
        role: undefined,
        roles: ['Estudiante']
      }

      const exist = users.find(
        user => user.email === data.email || user.username === data.username
      )

      if (exist) {
        try {
          const updateUser = await userDB.update(exist._id, {
            moodleId: moodleUser.id,
            roles: [...exist.roles, 'Estudiante']
          })
          console.log('update User', updateUser)
          return updateUser
        } catch (error) {
          console.log('error al editar usuario', exist, error)
          return error
        }
      } else {
        try {
          const user = await userDB.create(data)
          return user
        } catch (error) {
          console.log('error al crear usuario', moodleUser)
          return error
        }
      }
    })
  )

  return newUsers
}

const migrateEnrollMoodle = async () => {
  const SQL_QUERY =
    'SELECT ue.id, ue.status, ue.enrolid, ue.userid, ue.timestart, e.courseid, e.status AS state FROM mdl_user_enrolments AS ue INNER JOIN mdl_enrol AS e ON ue.enrolid = e.id'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })
  const users = await userDB.list({
    select: 'moodleId firstName lastName'
  })

  const dataEnrolls = await sqlConsult(SQL_QUERY)
  let not = 0
  const newEnrolls = await Promise.all(
    dataEnrolls.map(async (enrol, idx) => {
      const course = courses.find(
        item => parseInt(item.moodleId) === parseInt(enrol.courseid)
      )
      const user = users.find(
        item => parseInt(item.moodleId) === parseInt(enrol.userid)
      )

      if (course && user) {
        const data = {
          ...enrol,
          moodleId: enrol.id,
          linked: {
            ...user.toJSON(),
            ref: user._id
          },
          course: {
            ...course.toJSON(),
            ref: course._id
          },
          date: moment.unix(enrol.timestart).format('YYYY-MM-DD HH:mm')
        }
        try {
          const enrol = await enrolDB.create(data)
          return enrol
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        if (!course) {
          console.log('not Courseeeeeee', enrol.courseid)
        } else {
          console.log('not user', enrol.userid)
        }
        return enrol
      }
    })
  )

  return newEnrolls
}

const migrateQuizMoodle = async () => {
  const SQL_QUERY = 'SELECT * FROM mdl_quiz'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })

  const dataQuiz = await sqlConsult(SQL_QUERY)
  let not = 0

  const dataFilter = dataQuiz.filter(
    (item, index, self) =>
      index ===
      self.findIndex(t => t.course === item.course && t.name === item.name)
  )

  const newExams = await Promise.all(
    dataFilter.map(async (exam, idx) => {
      const course = courses.find(item => item.moodleId === exam.course)
      if (course) {
        const data = {
          moodleId: exam.id,
          name: exam.name,
          number: idx + 1,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }
        try {
          const exam = await examDB.create(data)
          return exam
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        console.log('------------------NO---------------------------')
        console.log('exam', exam)
        console.log('course', course)
        return exam
      }
    })
  )

  console.log('not', not)
  return newExams
}

const migrateTaskMoodle = async () => {
  const SQL_QUERY = 'SELECT * FROM mdl_assign'

  const courses = await courseDB.list({
    select: 'moodleId name shortName academicHours price'
  })

  const dataTask = await sqlConsult(SQL_QUERY)
  let not = 0

  const dataFilter = dataTask.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        t =>
          t.course === item.course &&
          toSlug(t.name, { lower: true }) ===
            toSlug(item.name.trim(), { lower: true })
      )
  )

  const newTasks = await Promise.all(
    dataFilter.map(async (task, idx) => {
      const course = courses.find(item => item.moodleId === task.course)
      if (course) {
        const data = {
          moodleId: task.id,
          name: task.name,
          description: task.intro,
          number: idx + 1,
          course: {
            ...course.toJSON(),
            ref: course._id
          }
        }

        try {
          const task = await taskDB.create(data)
          return task
        } catch (error) {
          console.log('error', error)
          return error
        }
      } else {
        not++
        console.log('------------------NO---------------------------')
        console.log('task', task)
        console.log('course', course)
        return task
      }
    })
  )

  console.log('not', not)
  return newTasks
}

const migrateEvaluationsMoodle2 = async () => {
  const SQL_QUERY =
    'SELECT qg.quiz, qg.userid, qg.grade AS score, q.course AS courseid FROM mdl_quiz_grades AS qg INNER JOIN mdl_quiz AS q ON qg.quiz = q.id'

  const allExams = await examDB.list({})
  const enrols = await enrolDB.list({})
  const dataQuizUser = await sqlConsult(SQL_QUERY)

  console.log('allExams', allExams.length)
  console.log('enrols', enrols.length)
  console.log('dataQuizUser', dataQuizUser.length)

  let not = 0

  const newEnrols = await Promise.all(
    enrols.map(async enrol => {
      const examsCourse = allExams.filter(exam => {
        return exam.course.moodleId === enrol.course.moodleId
      })

      const dataQuizPerCourseUser = dataQuizUser.filter(item => {
        return (
          item.userid === enrol.linked.moodleId &&
          item.courseid === enrol.course.moodleId
        )
      })

      if (dataQuizPerCourseUser.length === 0) {
        not++
        console.log('course', enrol.course.moodleId)
        console.log('user', enrol.linked.moodleId)
        console.log('-----------------------')
      }

      const exams = examsCourse.map(exam => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.quiz === exam.id
        )
        const result = _.maxBy(result_filter, 'score')
        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.score,
          isTaken: !!result,
          exam: exam._id
        }
        return data
      })

      const updateEnroll = await enrolDB.update(enrol._id, { exams })
      return updateEnroll
    })
  )

  console.log('not', not)

  return newEnrols
}

const migrateEvaluationsMoodle = async () => {
  const courses = await courseDB.list({ select: 'moodleId name' })
  const resps = await Promise.all(
    courses.map(async ({ moodleId, name }, idx) => {
      return new Promise((resolve, reject) => {
        if (moodleId) {
          setTimeout(async () => {
            try {
              const resp = await migrateEvaluationCourse(moodleId, name)
              return resolve(resp)
            } catch (error) {
              return reject(error)
            }
          }, idx * 5 * 1000)
        } else {
          return resolve({ not: 0 })
        }
      })
    })
  )
  let not = 0
  resps.forEach(item => (not += item.not))

  console.log('notAllll', not)

  return resps
}

const migrateEvaluationCourse = async (courseId, name) => {
  const SQL_QUERY = `SELECT u.id AS userid, c.id AS courseid, u.username AS 'Username', u.firstname AS 'Name' , u.lastname AS 'Surname', c.fullname AS 'Course', cc.name AS 'Category', CASE WHEN gi.itemtype = 'Course' THEN c.fullname + ' Course Total' ELSE gi.itemname END AS 'Item_Name', ROUND(gg.finalgrade,2) AS Score,ROUND(gg.rawgrademax,2) AS MAX, ROUND(gg.finalgrade / gg.rawgrademax * 100 ,2) AS Percentage, IF (ROUND(gg.finalgrade / gg.rawgrademax * 100 ,2) > 79,'Yes' , 'No') AS Pass FROM mdl_course AS c JOIN mdl_context AS ctx ON c.id = ctx.instanceid JOIN mdl_role_assignments AS ra ON ra.contextid = ctx.id JOIN mdl_user AS u ON u.id = ra.userid JOIN mdl_grade_grades AS gg ON gg.userid = u.id JOIN mdl_grade_items AS gi ON gi.id = gg.itemid JOIN mdl_course_categories AS cc ON cc.id = c.category WHERE gi.courseid = c.id AND gi.itemname != 'Attendance' AND gi.courseid= ${courseId} AND c.id= ${courseId} ORDER BY 'Username' ASC`

  const query = {
    'course.moodleId': courseId
  }
  const allExams = await examDB.list({ query })
  const allTasks = await taskDB.list({ query })
  const enrols = await enrolDB.list({ query })
  const dataQuizUser = await sqlConsult(SQL_QUERY)

  console.log(`"********************* ${name} *****************************"`)
  console.log('allExams', allExams.length)
  console.log('enrols', enrols.length)
  console.log('dataQuizUser', dataQuizUser.length)

  let not = 0

  const newEnrols = await Promise.all(
    enrols.map(async enrol => {
      const examsCourse = allExams
      const tasksCourse = allTasks

      const dataQuizPerCourseUser = dataQuizUser.filter(item => {
        return (
          item.userid === enrol.linked.moodleId &&
          item.courseid === enrol.course.moodleId
        )
      })

      if (dataQuizPerCourseUser.length === 0) {
        not++
      }

      const exams = examsCourse.map(exam => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.Item_Name === exam.name
        )
        const result = _.maxBy(result_filter, 'Score')
        const data = {
          number: exam.number,
          name: exam.name,
          score: result && result.Score,
          isTaken: !!result,
          exam: exam._id
        }
        return data
      })

      const tasks = tasksCourse.map(task => {
        const result_filter = _.filter(
          dataQuizPerCourseUser,
          item => item.Item_Name === task.name
        )
        const result = _.maxBy(result_filter, 'Score')
        const data = {
          number: task.number,
          name: task.name,
          score: result && result.Score,
          isTaken: !!result,
          task: task._id
        }
        return data
      })

      const exam = calculateProm(exams)
      const task = calculateProm(tasks)
      let dataEnrol = { exams, tasks }
      if (exam.isFinished || task.isFinished) {
        let note = 0
        if (exam.isFinished && task.isFinished) {
          note = (exam.note + task.note) / 2
        } else if (exam.isFinished) {
          note = exam.note
        } else {
          note = task.note
        }
        dataEnrol = {
          exams,
          tasks,
          isFinished: true,
          score: note
        }
      }

      const updateEnroll = await enrolDB.update(enrol._id, dataEnrol)
      return updateEnroll
    })
  )

  return { newEnrols, not }
}
   
const migrateCertificates = async dataCertificate => {
  const enrols = await enrolDB.list({})
  const users = await userDB.list({})
  const courses = await courseDB.list({})
  let not = 0
  const resp = dataCertificate.map(async element => {
    // console.log(element)
    const user = users.find(user => {
      const isFirstName =
        compareOnlySimilarity(user.firstName, element.firstName) > 0.9
      const isLastName =
        compareOnlySimilarity(user.lastName, element.lastName) > 0.9

      return isFirstName && isLastName
    })

    if (!user) {
      not++
      console.log('Not User', element)
      return
    }

    const course = courses.find(course => {
      let isCourse =
        compareOnlySimilarity(course.shortName, element.course) > 0.8

      if (!isCourse) {
        isCourse =
          element.course.includes(course.shortName) ||
          course.name.includes(element.course)
      }

      return isCourse
    })

    if (!course) {
      not++

      console.log('Not Course', element)
      return
    }

    const enrol = enrols.find(enrol => {
      const isCourse = course._id.toString() === enrol.course.ref.toString()
      const isUser = enrol.linked.ref.toString() === user._id.toString()

      return isCourse && isUser
    })

    if (!enrol) {
      // console.log('Not enrol', element)
      // return
    }

    const data = {
      code: element.code,
      shortCode: element.shortCode,
      linked: {
        firstName: user.firstName,
        lastName: user.lastName,
        ref: user._id
      },
      course: {
        shortName: course.shortName,
        academicHours: course.academicHours,
        ref: course._id
      },
      moodleId: course.moodleId,
      enrol: enrol && enrol._id,
      score: element.score,
      date: new Date(element.date)
    }
    try {
      const certi = await certificateDB.create(data)

      if (enrol && enrol.isFinished) {
        await enrolDB.update(enrol._id, {
          certificate: {
            ...certi.toJSON(),
            ref: certi._id
          }
        })
      }

      return certi
    } catch (error) {
      return error
    }
  })
  return resp
  // const getConvert = field =>
  //   `(CASE WHEN LENGTH(code) > 7 THEN CONVERT(CAST(CONVERT(${field} USING latin1) AS BINARY) USING utf8) ELSE ${field} END) as ${field}s`

  // const SQL_QUERY = `SELECT *, ${getConvert('course')}, ${getConvert(
  //   'firstname'
  // )}, ${getConvert('lastname')} FROM wp_certificate`

  // const enrols = await enrolDB.list({})
  // const users = await userDB.list({})
  // const courses = await courseDB.list({})

  // const dataCertificate = await sqlConsult(SQL_QUERY, 'manvicio_xyzwp')

  // let not = 0

  // const resp = await Promise.all(
  //   dataCertificate.map(async certificate => {
  //     const user = users.find(user => {
  //       const isFirstName =
  //         compareOnlySimilarity(user.firstName, certificate.firstnames) > 0.9
  //       const isLastName =
  //         compareOnlySimilarity(user.lastName, certificate.lastnames) > 0.9

  //       return isFirstName && isLastName
  //     })

  //     if (!user) {
  //       not++
  //       console.log('Not User', certificate)
  //       return
  //     }

  //     const course = courses.find(course => {
  //       let isCourse =
  //         compareOnlySimilarity(course.shortName, certificate.courses) > 0.8

  //       if (!isCourse) {
  //         isCourse =
  //           certificate.courses.includes(course.shortName) ||
  //           course.name.includes(certificate.courses)
  //       }

  //       return isCourse
  //     })

  //     if (!course) {
  //       not++

  //       console.log('Not Course', certificate)
  //       return
  //     }

  //     const enrol = enrols.find(enrol => {
  //       const isCourse = course._id.toString() === enrol.course.ref.toString()
  //       const isUser = enrol.linked.ref.toString() === user._id.toString()

  //       return isCourse && isUser
  //     })

  //     if (!enrol) {
  //       return
  //     }

  //     const data = {
  //       code: certificate.code,
  //       shortCode: certificate.codeshort,
  //       linked: {
  //         firstName: user.firstName,
  //         lastName: user.lastName,
  //         ref: user._id
  //       },
  //       course: {
  //         shortName: course.shortName,
  //         academicHours: certificate.hours,
  //         ref: course._id
  //       },
  //       moodleId: certificate.id,
  //       enrol: enrol && enrol._id,
  //       score: certificate.score,
  //       date: Date(certificate.date)
  //     }

  //     try {
  //       const certi = await certificateDB.create(data)

  //       if (enrol && enrol.isFinished) {
  //         await enrolDB.update(enrol._id, {
  //           certificate: {
  //             ...certi.toJSON(),
  //             ref: certi._id
  //           }
  //         })
  //       }

  //       return certi
  //     } catch (error) {
  //       return error
  //     }
  //   })
  // )

  // console.log('not', not)

  // return resp
}

module.exports = {
  migrateTeachers,
  migrateCourses,
  migrateCategories,
  migrateMoodleCourses,
  migrateUsersMoodle,
  migrateEnrollMoodle,
  migrateEvaluationsMoodle,
  migrateQuizMoodle,
  migrateTaskMoodle,
  migrateCertificates
}
