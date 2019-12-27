'use strict'

const getAllFiles = require('./getAllFiles')
const getModifiedFiles = require('./getModifiedFiles')
const getStagedFiles = require('./getStagedFiles')

const MODIFIED = 'modified'
const STAGED = 'staged'
const ALL = 'all'
const CI = 'ci'

module.exports = {
  MODIFIED,
  STAGED,
  ALL,
  CI,
  isValid: mode => [MODIFIED, STAGED, ALL, CI].indexOf(mode) >= 0,
  doGitAdd: mode => [STAGED].indexOf(mode) >= 0,
  getFiles: (mode, options) => {
    switch (mode) {
      case MODIFIED:
        return getModifiedFiles(options)
      case STAGED:
        return getStagedFiles(options)
      default:
        return getAllFiles(options)
    }
  }
}
