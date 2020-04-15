module.exports = {
  apps : [
    {
      name: 'APP_DEV',
      script: 'app.js',
      autorestart: true,
      watch: true,
      watch_delay: 1000,
      ignore_watch : ["node_modules", "public", 'appPage'],
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'development',
        MODE: 'dev',
        MONGODB_USERNAME: '',
        MONGODB_PASS: '',
        PORT: 3000,
        VK_API_TOKEN: '',
        VK_SERVICE_KEY: '',
        VK_GROUP_ID: '',
        VK_APP_ID: 0000000,
        VK_APP_SICRET: '',
        R_PASS1: '',
        R_PASS2: '',
        R_PASS_DEMO1: '',
        R_PASS_DEMO2: '',
        VK_ID_ADMIN: 00000000,
        VK_API_TOKENS: [
          '',
          '',
          ''
        ]
      }
    },
    {
      name: 'APP_PROD',
      script: 'app.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        MODE: 'prod',
        MONGODB_USERNAME: '',
        MONGODB_PASS: '',
        PORT: 3000,
        VK_API_TOKEN: '',
        VK_SERVICE_KEY: '',
        VK_GROUP_ID: '',
        VK_APP_ID: 0000000,
        VK_APP_SICRET: '',
        R_PASS1: '',
        R_PASS2: '',
        R_PASS_DEMO1: '',
        R_PASS_DEMO2: '',
        VK_ID_ADMIN: 00000000,
        VK_API_TOKENS: [
          '',
          '',
          ''
        ]
      }
    }
  ],

  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
