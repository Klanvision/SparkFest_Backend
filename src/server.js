const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`========================================`);
  console.log(` DIWALI DHAMAKA REST API SERVER RUNNING `);
  console.log(`========================================`);
  console.log(` Port: ${config.port}`);
  console.log(` Environment: ${config.env}`);
  console.log(` Health: http://localhost:${config.port}/health`);
  console.log(` API Base: http://localhost:${config.port}/api`);
  console.log(`========================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
