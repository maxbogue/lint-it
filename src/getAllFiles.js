'use strict'

const execGit = require('./execGit')

module.exports = async function getAllFiles(options) {
  try {
    const lines = await execGit(['ls-files'], options)
    return lines ? lines.split('\n') : []
  } catch (error) {
    return null
  }
}
