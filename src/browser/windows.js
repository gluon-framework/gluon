import { exec as _e } from 'node:child_process'
import { promisify } from 'node:util'
import { join, basename } from 'node:path'

const REG_PATH = (process.platform === 'win32') ? join(process.env.windir, 'system32', 'reg.exe') : 'REG'
const ITEM_PATTERN = /^\s*([^\s]*)\s*(REG_SZ|REG_MULTI_SZ|REG_EXPAND_SZ|REG_DWORD|REG_QWORD|REG_BINARY|REG_NONE)[^\S\r\n]*(.*)$/gm
const FOLDER_PATTERN = /^(HKEY_.*)[^\S\r\n]*$/gm
const INTERNET_CLIENTS_PATH = '\\SOFTWARE\\Clients\\StartMenuInternet'
const DEFAULT_KEY = '(Default)'

const exec = promisify(_e)

async function query (path) {
  // exec can throw error, but this should be caught outside of this function
  const out = await getRegOutput(path)
  const items = {}
  for (let match = ITEM_PATTERN.exec(out); match; match = ITEM_PATTERN.exec(out)) {
    if (match.index === ITEM_PATTERN.lastIndex) ITEM_PATTERN.lastIndex++
    const [_, name, type, data] = match
    items[name] = { type, data }
  }
  return items
}

async function list (path) {
  const values = await getRegOutput(path + ' /v ""')
  // we only want to list folders so we exclude values
  // this can probably be done via regex, but this is simpler
  const entries = (await getRegOutput(path)).replace(values, '')
  return entries.match(FOLDER_PATTERN)
}

async function getRegOutput (cmd) {
  const { stdout, stderr } = await exec(REG_PATH + ' query ' + cmd, { cwd: undefined, env: process.env })
  if (stderr) throw stderr
  return stdout
}

async function getProgIdPath (progID) {
  const items = await query(`HKCR\\${progID}\\shell\\open\\command`)
  const defaultItem = items[DEFAULT_KEY]
  if (!defaultItem) return null
  const defaultPath = defaultItem.data.slice(1)
  return defaultPath.slice(0, defaultPath.indexOf('"'))
}

export async function getUserPreferred () {
  const userPreferred = await query('HKCU\\SOFTWARE\\Microsoft\\Windows\\Shell\\Associations\\URLAssociations\\https\\UserChoice')
  return getProgIdPath(userPreferred.ProgID.data)
}

export async function getInstalledBrowsers () {
  const machineClients = await list('HKLM' + INTERNET_CLIENTS_PATH)
  const userClients = await list('HKCU' + INTERNET_CLIENTS_PATH)
  const browsers = {}
  // should this be batched?
  // user clients should overwrite machine clients
  for (const path of [...machineClients, ...userClients]) {
    try {
      browsers[basename(path)] = (await query(path + '\\shell\\open\\command'))[DEFAULT_KEY]?.data.slice(1, -1)
    } catch (e) {}
  }
  return browsers
}
