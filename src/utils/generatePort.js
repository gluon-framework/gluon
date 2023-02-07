import { PORT_RANGE } from '../constants.js'

export const generatePort = (portRange = PORT_RANGE) => (Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0]);