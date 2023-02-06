import { sep } from 'node:path'
import { exists } from './exists.js'

export const existsInPathOrInBin = async (path, binariesInPath) => {
  if (path.includes(sep)) return exists(path);

  // just binary name, so check path
  return binariesInPath.includes(path);
};