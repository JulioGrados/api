'use strict'

const { timelineDB } = require('../db')

const listTimelines = async params => {
  const timelines = await timelineDB.list(params)
  return timelines
}

const createTimeline = async ({ lead, loggedUser, assigned, ...body }) => {
  if (lead) {
    body.lead = lead._id || lead
  }

  if (loggedUser) {
    body.loggedUser = {
      username: loggedUser.username,
      ref: loggedUser._id
    }
    body.assigned = body.loggedUser
  }

  if (assigned) {
    body.assigned = {
      username: assigned.username,
      ref: assigned._id
    }
  }

  try {
    const timeline = await timelineDB.create(body)
    return timeline
  } catch (error) {
    //avisar del error
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

module.exports = {
  countDocuments,
  listTimelines,
  createTimeline,
  detailTimeline
}
