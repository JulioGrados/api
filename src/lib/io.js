const socketIo = require('socket.io')
const { socketHandler } = require('../auth')

let io

const connectIO = server => {
  if (io) {
    return io
  }

  io = socketIo(server)

  io.use(socketHandler)

  io.on('connection', socket => {
    console.log('Nuevo cliente conectado', socket.id, socket.assessor.username)

    if (socket.assessor) {
      socket.join(socket.assessor._id)
    }
  })

  return io
}

const getSocket = () => {
  return io
}

module.exports = {
  connectIO,
  getSocket
}
