const conf = require('sp-conf');

const regexForIpV4Address = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;

module.exports = {
  port: conf.readNumber("PORT", {defaultValue: 8080}),
  database: {
    host: conf.readString("DB_HOST_IP", {validator: regexForIpV4Address}),
    port: conf.readNumber("DB_PORT"),
    username: conf.readString("DB_USERNAME"),
    password: conf.readPassword("DB_PASSWORD")
  }
};

if(conf.missingEnvVars) {
  console.error("Some required env vars were missing. Terminating");
  process.exit(1);
}
