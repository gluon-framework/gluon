import { delimiter } from 'node:path'
import { readdir } from 'node:fs/promises'

export const getBinariesInPath = async () => {
  return (
    await Promise.all(
      process.env.PATH
        .replaceAll('"', '')
        .split(delimiter)
        .filter(Boolean)
        .map(x => readdir(x.replace(/"+/g, '')).catch(() => []))
    )
  ).flat()
}