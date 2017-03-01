#SP Conf
[![Build Status](https://travis-ci.org/codeite/sp-conf.svg?branch=master)](https://travis-ci.org/codeite/sp-conf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

SimPle CONFig

A small component for reading config.
It will log all the variables your are reading so you can see what values your app it using.
It will also check where any variables are missing and allow your to respond.

## Gettings Started

```
npm install sp-conf --save
```

## How to use

Check out example.js that shows an example of using it.
```javascript
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

conf.makeClonableAndDeepFreeze(myconfig)

if (conf.missingEnvVars) {
  console.error('Some required env vars were missing. Terminating')
  process.exit(1)
}

const mockConfig = conf.cloneAndRefreeze(x => x.user = 'test_user')

// mockConfig would be frozan and mockConfig.user would contain 'test_user'
console.log(mockConfig.user)

module.exports = myconfig
```

## Options common to all methods

defaultValue: The value to use if the specified value is not available

validator: A regular expressing to specify the format of the input value

## Methods available

readNumber - Read a number and complain if its not a number

readString - Read a string not applying any special rules

readPassword - Read a string but will obfuscate when logging the value out

readUrl - Read a URL and will obfuscate the password if the URL contains one.

readBool - Read a boolean and complain if it's not valid. Epected characters are:
 * truthy values - "true", "t", "on", "1"
 * falsy falues - "false", "f", "off", "0"
 * It is not case sensitive so, for exaple, both "True" and "TRUE" work just fine

## Deep freeze

deepFreezeAndMakeClonable
This will freeze all the properties on your object as well as sub objects.
It will also add a cloneAndRefreeze property to the object that, when called, will create a clone. The clone will also be frozen.

If you want to mutate the clone, when calling cloneAndRefreeze pass a callback with an argument that gets access to the clone before it is frozen.
