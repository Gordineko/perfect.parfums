const path = require("node:path");

const rootDir = __dirname;
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

module.exports = {
  apps: [
    {
      name: "maloe-server",
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
        SERVICE_NAME: "maloe-api",
        LOG_LEVEL: "info",
        LOG_DIR: "./logs",
        LOG_FILE: "./logs/app.log",
        LOG_TO_STDOUT: "false",
        SLOW_REQUEST_THRESHOLD_MS: 1000,
        BACKGROUND_JOBS_CONSUME_IN_API: "false",
      },
    },

    {
      name: "maloe-background-worker",
      cwd: path.join(rootDir, "server"),
      script: npmCmd,
      args: "run background:worker",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        SERVICE_NAME: "maloe-background-worker",
        LOG_LEVEL: "info",
        LOG_DIR: "./logs",
        LOG_FILE: "./logs/app.log",
        LOG_TO_STDOUT: "false",
      },
    },

    {
      name: "keycrm-integration",
      cwd: path.join(rootDir, "Integrations-with-KeyCRM"),
      script: npmCmd,
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
      },
    },

    {
      name: "maloe-admin",
      cwd: path.join(rootDir, "admin-panel"),
      script: npmCmd,
      args: "run start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
