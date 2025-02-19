'use strict'

const resolveTaskFn = require('./resolveTaskFn')
const modes = require('./modes')

const debug = require('debug')('lint-it:make-cmd-tasks')

const FIX_FLAGS = {
  eslint: '--fix',
  jsonlint: '--in-place',
  prettier: '--write',
  stylelint: '--fix'
}

function normalizeCommand(cmd) {
  if (typeof cmd === 'string') {
    const fixFlag = FIX_FLAGS[cmd.split(' ')[0]]

    if (fixFlag) {
      return {
        check: cmd.replace(` ${fixFlag}`, ''),
        fix: cmd
      }
    }

    return {
      check: cmd,
      fix: cmd
    }
  }

  return cmd
}

/**
 * Creates and returns an array of listr tasks which map to the given commands.
 *
 * @param {object} options
 * @param {Array<string|Function>|string|Function} options.commands
 * @param {Array<string>} options.files
 * @param {string} options.gitDir
 * @param {Boolean} shell
 */
module.exports = async function makeCmdTasks({ mode, commands, files, gitDir, shell }) {
  debug('Creating listr tasks for commands %o', commands)
  const commandsArray = Array.isArray(commands) ? commands : [commands]

  return commandsArray.reduce((tasks, command) => {
    // command function may return array of commands that already include `stagedFiles`
    const isFn = typeof command === 'function'
    const resolved = isFn ? command(files) : command
    const commands = Array.isArray(resolved) ? resolved : [resolved] // Wrap non-array command as array

    if (modes.shouldGitAdd(mode)) {
      commands.push('git add')
    }

    // Function command should not be used as the task title as-is
    // because the resolved string it might be very long
    // Create a matching command array with [file] in place of file names
    let mockCommands
    if (isFn) {
      const mockFileList = Array(files.length).fill('[file]')
      const resolved = command(mockFileList)
      mockCommands = Array.isArray(resolved) ? resolved : [resolved]
    }

    commands.forEach((rawCommand, i) => {
      const normalized = normalizeCommand(rawCommand)
      const command = modes.shouldFix(mode) ? normalized.fix : normalized.check

      let title = isFn ? '[Function]' : command
      if (isFn && mockCommands[i]) {
        // If command is a function, use the matching mock command as title,
        // but since might include multiple [file] arguments, shorten to one
        title = mockCommands[i].replace(/\[file\].*\[file\]/, '[file]')
      }

      const task = { title, task: resolveTaskFn({ gitDir, isFn, command, files, shell }) }
      tasks.push(task)
    })

    return tasks
  }, [])
}
