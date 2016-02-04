'use strict'

const urlLib = require('url')

module.exports = SpConf

function SpConf (defaultOptions) {
  this.defaultOptions = _cleanOptions(defaultOptions)
  this.missingEnvVars = false
}
SpConf.missingEnvVars = false

SpConf.prototype.readString = function (name, options) {
  return readString(name, options, this)
}
SpConf.readString = function (name, options) {
  return readString(name, options, module.exports)
}

function readString (name, options, owner) {
  if (Array.isArray(name)) return _tryEach(readString, 'string', name, options, owner)

  options = _cleanOptions(options, owner && owner.defaultOptions)
  const val = options.source[name]
  if (val !== undefined) {
    if (_failedvalidator(options.validator, val)) {
      options.error(`Expected env var "${name}" to be match pattern "${options.validator}" but was "${val}" and did not.`)
      owner.missingEnvVars = true
    } else {
      options.log('Using env var', name, val)
      return val
    }
  } else if (options.defaultValue !== undefined) {
    options.log('Using default', name, options.defaultValue)
    return options.defaultValue
  } else {
    options.error(`Required string env var "${name}" was not supplied.`)
    owner.missingEnvVars = true
  }
}

SpConf.prototype.readNumber = function (name, options) {
  return readNumber(name, options, this)
}
SpConf.readNumber = function (name, options) {
  return readNumber(name, options, module.exports)
}
function readNumber (name, options, owner) {
  if (Array.isArray(name)) return _tryEach(readNumber, 'number', name, options, owner)

  options = _cleanOptions(options, owner && owner.defaultOptions)
  const val = options.source[name]
  if (val !== undefined) {
    const number = parseInt(val, 10)
    if (('' + number) !== val) {
      options.error(`Expected env var "${name}" to be numeric but was "${val}".`)
      owner.missingEnvVars = true
    } else {
      options.log('Using env var', name, number)
      return number
    }
  } else if (options.defaultValue !== undefined) {
    options.log('Using default env var', name, options.defaultValue)
    return options.defaultValue
  } else {
    options.error(`Required numeric env var "${name}" was not supplied.`)
    owner.missingEnvVars = true
  }
}

SpConf.prototype.readPassword = function (name, options) {
  return readPassword(name, options, this)
}
SpConf.readPassword = function (name, options) {
  return readPassword(name, options, module.exports)
}
function readPassword (name, options, owner) {
  if (Array.isArray(name)) return _tryEach(readPassword, 'password', name, options, owner)

  options = _cleanOptions(options, owner && owner.defaultOptions)
  const val = options.source[name]
  if (val !== undefined) {
    options.log('Using env var', name, _obfuscate(val))
    return val
  } else if (options.defaultValue !== undefined) {
    options.log('Using default', name, _obfuscate(options.defaultValue))
    return options.defaultValue
  } else {
    options.error(`Required password env var "${name}" was not supplied.`)
    owner.missingEnvVars = true
  }
}

SpConf.prototype.readUrl = function (name, options) {
  return readUrl(name, options, this)
}
SpConf.readUrl = function (name, options) {
  return readUrl(name, options, module.exports)
}

function readUrl (name, options, owner) {
  if (Array.isArray(name)) return _tryEach(readUrl, 'url', name, options, owner)

  options = _cleanOptions(options, owner && owner.defaultOptions)
  const val = options.source[name]
  if (val !== undefined) {
    if (_failedvalidator(options.validator, val)) {
      options.error(`Expected env var "${name}" to be match pattern "${options.validator}" but was "${_obfuscateAuth(val)}" and did not.`)
      owner.missingEnvVars = true
    } else {
      options.log('Using env var', name, _obfuscateAuth(val))
      return val
    }
  } else if (options.defaultValue !== undefined) {
    options.log('Using default', name, _obfuscateAuth(options.defaultValue))
    return options.defaultValue
  } else {
    options.error(`Required url env var "${name}" was not supplied.`)
    owner.missingEnvVars = true
  }
}

SpConf.obfuscate = _obfuscate
function _obfuscate (str) {
  if (!str) return str

  let showBits = Math.floor(str.length / 6)
  if (showBits > 3) showBits = 3

  const start = str.substr(0, showBits)
  const end = str.substr(-showBits, showBits)

  const middle = new Array(str.length - ((showBits * 2) - 1)).join('*')

  return start + middle + end
}

SpConf.obfuscateAuth = _obfuscateAuth
function _obfuscateAuth (url) {
  url = urlLib.parse(url)

  if (url.auth && url.auth.split) {
    const bits = url.auth.split(':')

    if (bits[1]) {
      bits[1] = _obfuscate(bits[1])
      url.auth = bits.join(':')
    }
  }

  return url.format()
}

function _tryEach (func, type, names, options, owner) {
  var found = null

  const cleanOptions = _cleanOptions(options, owner && owner.defaultOptions)
  names.find(name => {
    const innerOptions = Object.assign({}, options, {error: _ => null})
    delete innerOptions.defaultValue
    const innerOwner = Object.assign({}, owner)

    found = func(name, innerOptions, innerOwner)

    if (found) return found
    cleanOptions.log(`Could not use ${type} "${name}".`)
  })

  if (found) return found

  if (cleanOptions.defaultValue !== undefined) {
    cleanOptions.log('Using default for', names, cleanOptions.defaultValue)
    return cleanOptions.defaultValue
  }

  owner.missingEnvVars = true
  cleanOptions.error(`At least one of required ${type}s "${names.join('" or "')}" was not supplied.`)
}

function _failedvalidator (validator, val) {
  if (!validator) return false

  if (typeof validator === 'string') validator = new RegExp(validator)

  return !validator.test(val)
}

function _cleanOptions (options, defaultOptions) {
  if (typeof options === 'string') {
    options = {
      'defaultValue': options
    }
  }

  if (options === undefined) options = {}
  if (defaultOptions) options = Object.assign({}, defaultOptions, options)

  if (options.source === undefined) options.source = process.env

  if (options.log === undefined) {
    options.log = function () {
      console.log.apply(console, arguments)
    }
  }

  if (options.error === undefined) {
    options.error = function () {
      console.error.apply(console, arguments)
    }
  }

  return options
}
