const conf = require('sp-conf')

const regexForIpV4Address = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/

const myconfig = {
  port: conf.readNumber('PORT', {defaultValue: 8080}),
  user: conf.readString(['CURRENT_USER', 'DEFAULT_USER']),
  serviceUrl: conf.readUrl('SERVICE_URL'),
  database: {
    host: conf.readString('DB_HOST_IP', {validator: regexForIpV4Address}),
    port: conf.readNumber('DB_PORT'),
    username: conf.readString('DB_USERNAME'),
    password: conf.readPassword('DB_PASSWORD'),
    keepConnectionOpen: conf.readBool('KEEP_CONNECTION_OPEN'),
  }
}

conf.deepFreezeAndMakeClonable(myconfig)

if (conf.missingEnvVars) {
  console.error('Some required env vars were missing. Terminating')
  process.exit(1)
}

const mockConfig = conf.cloneAndRefreeze(x => x.user = 'test_user')

// mockConfig would be frozan and mockConfig.user would contain 'test_user'
console.log(mockConfig.user)

module.exports = myconfig
