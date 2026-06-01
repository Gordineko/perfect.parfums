const path = require("node:path");

const rootDir = __dirname;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

module.exports = {
  apps: [
    {
      name: "perfect-parfums-api",
      cwd: path.join(rootDir, "server"),
      script: npmCmd,
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 5007,
        SERVICE_NAME: "perfect-parfums-api",
        LOG_LEVEL: "info",
        LOG_DIR: "./logs",
        LOG_FILE: "./logs/api.log",
        LOG_TO_STDOUT: "false",
        SLOW_REQUEST_THRESHOLD_MS: 1000,
      },
    },

    {
      name: "perfect-parfums-client",
      cwd: path.join(rootDir, "client"),
      script: npmCmd,
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
