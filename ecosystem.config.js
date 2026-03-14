module.exports = {
  apps: [{
    name: "telegram-bot",
    script: "scripts/telegram-bot.ts",
    cwd: "C:\\Users\\admin\\stone-ai",
    interpreter: "node",
    interpreter_args: "--import tsx/esm --require tsx/cjs",
    env: {
      NODE_ENV: "production"
    },
    restart_delay: 5000,
    max_restarts: 50,
    autorestart: true
  }]
};
