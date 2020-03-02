module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'eaitest'
    },
    binary: {
      version: '4.0.3', // Version of MongoDB
      skipMD5: true
    },
    autoStart: false
  }
}
