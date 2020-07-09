const CronJob = require('cron').CronJob

const { getDelayCalls } = require('../services/call')

const job = new CronJob(
  '0 */2 9-19 * * *',
  getDelayCalls,
  null,
  true,
  'America/Bogota'
)

job.start()

module.exports = {
  job
}
