let jsonSql = require('json-sql')()
/* 
const promise = require('bluebird')
const SqlConnection = require('tedious').Connection
const Request = require('tedious').Request

const config = {
  server: '192.254.236.26',
  port: 3306,
  autauthentication: {
    options: {
      userName: 'manvicio',
      password: 'S!RRSwcOcM*d'
    }
  },
  options: {
    database: 'manvicio',
    instanceName: 'mysql',
    rowCollectionOnRequestCompletion: true,
    rowCollectionOnDone: true,
    trustServerCertificate: false
  }
}

const createSelectQuery = (filter, sort) => {
  let sql = jsonSql.build({
    dialect: 'mysql',
    type: 'select',
    table: 'mdl_enrol'
    fields: [
      'id',
      'enrol',
      'status',
      'Direccion',
      'CodigoPostal',
      'Poblacion',
      'Provincia',
      'ComunidadAutonoma',
      'Pais',
      'FechaModificacion'
    ], */
/* condition: filter,
    sort: sort
  })
  return sql
}

const executeQuery = async query => {
  let resultEntity = {
    result: {},
    error: null
  }

  return new promise((resolve, reject) => {
    var connection = new SqlConnection(config)

    connection.on('connect', async err => {
      if (err) {
        return reject(new Error(err))
      }
      let request = new Request(query, function (err, rowCount, rows) {
        console.log('error request', err)
        console.log('rowCount', rowCount)
        console.log('rows', rows)
        if (err) {
          resultEntity.error = err
          return reject(resultEntity)
        } else {
          resultEntity.result = rows
          connection.close()
          return resolve(resultEntity)
        }
      })
      await connection.execSql(request)
    })
  })
}

const getAllEnrollments = async () => {
  const get_enroll = createSelectQuery()
  console.log(get_enroll)
  try {
    const resp = await executeQuery(get_enroll)
    return resp
  } catch (error) {
    throw error
  }
}

module.exports = {
  getAllEnrollments
}
 */

var mysql = require('mysql')

const createSelectQuery = otros => {
  let sql = jsonSql.build({
    dialect: 'mysql',
    type: 'select',
    ...otros
  })
  return sql
}

const config = {
  host: '192.254.236.26',
  user: 'manvicio',
  password: 'S!RRSwcOcM*d',
  database: 'manvicio_ertmdl'
}

const SqlConsult = query =>
  new Promise((resolve, reject) => {
    try {
      const connection = mysql.createConnection(config)
      connection.connect()

      connection.query(query, function (error, results, fields) {
        if (error) {
          console.log('error query', error)
          throw reject(error)
        }

        connection.end()
        return resolve(results)
      })
    } catch (error) {
      throw reject(error)
    }
  })

//deleted
const getAllEnrollments = async () => {
  const Consulta = createSelectQuery({
    table: 'mdl_user',
    fields: [
      'id',
      'username',
      'password',
      'firstname',
      'lastname',
      'email',
      'phone1',
      'phone2',
      'address',
      'city',
      'country'
    ],
    condition: {
      deleted: 0
    }
  })

  const sql2 = createSelectQuery({
    table: 'mdl_user_enrolments',
    fields: [
      'mdl_user_enrolments.id',
      'mdl_user_enrolments.status',
      'mdl_enrol.courseid',
      'enrolid',
      'userid',
      'timestart'
    ],
    join: {
      mdl_enrol: {
        on: { 'mdl_user_enrolments.enrolid': 'mdl_enrol.id' }
      }
    }
  })

  const sqlQuery = sql2.query.replace(/\"|;/g, '')
  try {
    const results = await SqlConsult(sqlQuery)
    return results
  } catch (error) {
    throw error
  }
}

module.exports = {
  getAllEnrollments
}
