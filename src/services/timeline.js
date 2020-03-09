'use strict'

const { timelineDB } = require('../db')
const { getSocket } = require('../lib/io')

const listTimelines = async params => {
  const timelines = await timelineDB.list(params)
  return timelines
}

const createTimeline = async ({ linked, assigned, ...body }) => {
  if (linked) {
    body.linked = {
      names: linked.names,
      ref: linked._id || linked.ref
    }
  }

  if (assigned) {
    body.assigned = {
      username: assigned.username,
      ref: assigned._id || assigned.ref
    }
  }

  try {
    const timeline = await timelineDB.create(body)
    emitTimeline(timeline)
    return timeline
  } catch (error) {
    console.log('error timeline', body, error)
  }
}

const detailTimeline = async params => {
  const timeline = await timelineDB.detail(params)
  return timeline
}

const countDocuments = async params => {
  const count = await timelineDB.count(params)
  return count
}

/* functions */

const emitTimeline = timeline => {
  try {
    if (timeline.assigned) {
      const io = getSocket()
      io.to(timeline.assigned.ref).emit('timeline', timeline)
    }
  } catch (error) {
    console.log('error sockets', timeline, error)
  }
}

module.exports = {
  countDocuments,
  listTimelines,
  createTimeline,
  detailTimeline
}
