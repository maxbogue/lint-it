'use strict'

const execGit = require('./execGit')

module.exports = async function getStagedFiles(options) {
  try {
    const lines = await execGit(['diff', '--diff-filter=ACMR', '--name-only', 'HEAD'], options)
    return lines ? lines.split('\n') : []
  } catch (error) {
    return null
  }
}
