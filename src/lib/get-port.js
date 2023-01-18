import { createServer } from 'net'

export const getPort = async () =>  {
	return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
  
    server.listen(0, () => {
      const {port} = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
};