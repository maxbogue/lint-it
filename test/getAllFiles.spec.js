import getAllFiles from '../src/getAllFiles'
import execGit from '../src/execGit'

jest.mock('../src/execGit')

describe('getAllFiles', () => {
  it('should return array of file names', async () => {
    execGit.mockImplementationOnce(async () => 'foo.js\nbar.js')
    const all = await getAllFiles()
    expect(all).toEqual(['foo.js', 'bar.js'])
  })

  it('should return empty array when no staged files', async () => {
    execGit.mockImplementationOnce(async () => '')
    const all = await getAllFiles()
    expect(all).toEqual([])
  })

  it('should return null in case of error', async () => {
    execGit.mockImplementationOnce(async () => {
      throw new Error('fatal: not a git repository (or any of the parent directories): .git')
    })
    const all = await getAllFiles()
    expect(all).toEqual(null)
  })
})
