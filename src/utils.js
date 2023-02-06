export const PORT_RANGE = [ 10000, 60000 ];
export const generatePort = (portRange = PORT_RANGE) => (Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0]);