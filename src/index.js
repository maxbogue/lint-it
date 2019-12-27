'use strict'

const dedent = require('dedent')
const cosmiconfig = require('cosmiconfig')
const stringifyObject = require('stringify-object')
const printErrors = require('./printErrors')
const runAll = require('./runAll')
const validateConfig = require('./validateConfig')
const modes = require('./modes')

const debugLog = require('debug')('lint-it')

const errConfigNotFound = new Error('Config could not be found')

function resolveConfig(configPath) {
  try {
    return require.resolve(configPath)
  } catch (ignore) {
    return configPath
  }
}

function loadConfig(configPath) {
  const explorer = cosmiconfig('lint-it', {
    searchPlaces: [
      'package.json',
      '.lintstagedrc',
      '.lintstagedrc.json',
      '.lintstagedrc.yaml',
      '.lintstagedrc.yml',
      '.lintstagedrc.js',
      'lint-it.config.js'
    ]
  })

  return configPath ? explorer.load(resolveConfig(configPath)) : explorer.search()
}

/**
 * @typedef {(...any) => void} LogFunction
 * @typedef {{ error: LogFunction, log: LogFunction, warn: LogFunction }} Logger
 *
 * Root lint-it function that is called from `bin/lint-it`.
 *
 * @param {object} options
 * @param {string} [options.configPath] - Path to configuration file
 * @param {object}  [options.config] - Object with configuration for programmatic API
 * @param {boolean} [options.relative] - Pass relative filepaths to tasks
 * @param {boolean} [options.shell] - Skip parsing of tasks for better shell support
 * @param {boolean} [options.quiet] - Disable lint-it’s own console output
 * @param {boolean} [options.debug] - Enable debug mode
 * @param {boolean | number} [options.concurrent] - The number of tasks to run concurrently, or false to run tasks serially
 * @param {Logger} [logger]
 *
 * @returns {Promise<boolean>} Promise of whether the linting passed or failed
 */
module.exports = function lintStaged(
  {
    configPath,
    config,
    mode = modes.MODIFIED,
    relative = false,
    shell = false,
    quiet = false,
    debug = false,
    concurrent = true
  } = {},
  logger = console
) {
  debugLog('Loading config using `cosmiconfig`')

  if (!modes.isValid(mode)) {
    logger.error(`Invalid mode: ${mode}`)
    return Promise.reject()
  }

  return (config ? Promise.resolve({ config, filepath: '(input)' }) : loadConfig(configPath))
    .then(result => {
      if (result == null) throw errConfigNotFound

      debugLog('Successfully loaded config from `%s`:\n%O', result.filepath, result.config)
      // result.config is the parsed configuration object
      // result.filepath is the path to the config file that was found
      const config = validateConfig(result.config)
      if (debug) {
        // Log using logger to be able to test through `consolemock`.
        logger.log('Running lint-it with the following config:')
        logger.log(stringifyObject(config, { indent: '  ' }))
      } else {
        // We might not be in debug mode but `DEBUG=lint-it*` could have
        // been set.
        debugLog('lint-it config:\n%O', config)
      }

      return runAll({ config, mode, relative, shell, quiet, debug, concurrent }, logger)
        .then(() => {
          debugLog('tasks were executed successfully!')
          return Promise.resolve(true)
        })
        .catch(error => {
          printErrors(error, logger)
          return Promise.resolve(false)
        })
    })
    .catch(err => {
      if (err === errConfigNotFound) {
        logger.error(`${err.message}.`)
      } else {
        // It was probably a parsing error
        logger.error(dedent`
          Could not parse lint-it config.

          ${err}
        `)
      }
      logger.error() // empty line
      // Print helpful message for all errors
      logger.error(dedent`
        Please make sure you have created it correctly.
        See https://github.com/maxbogue/lint-it#configuration.
      `)

      return Promise.reject(err)
    })
}
