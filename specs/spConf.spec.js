'strict mode'
/* global describe, beforeEach, it */

require('must/register')

const LoggingLogger = require('./helpers/loggingLogger')

describe('sp-config', () => {
  var conf, logList, errorList

  beforeEach(() => {
    delete require.cache[require.resolve('../index.js')]
    conf = require('../index.js')
    logList = new LoggingLogger()
    errorList = new LoggingLogger()

    conf.defaultOptions = {
      log: logList.log.bind(logList),
      error: errorList.log.bind(errorList)
    }
  })

  describe('reading from the environment', () => {
    it('must be able to read from the environment', () => {
      const SP_CONFIG_TEST = 'SP_CONFIG_TEST'
      process.env[SP_CONFIG_TEST] = 'the test is good'

      const spConfigTest = conf.readString(SP_CONFIG_TEST)

      spConfigTest.must.equal('the test is good')
    })
  })

  describe('reading from an object source', () => {
    var source

    beforeEach(() => {
      source = {}
      conf.defaultOptions.source = source
    })

    describe('reading a string', () => {
      it('must be able to read a string and log success', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = 'cheese'

        const happyPath = conf.readString(HAPPY_PATH)

        happyPath.must.equal('cheese')
        conf.missingEnvVars.must.equal(false)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var HAPPY_PATH cheese')
      })

      it('must be able to use a default value for a string and report', () => {
        const MISSING_BUT_DEFAULT = 'MISSING_BUT_DEFAULT'

        const missingButDefault = conf.readString(MISSING_BUT_DEFAULT, {defaultValue: 'leopard'})

        missingButDefault.must.equal('leopard')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default MISSING_BUT_DEFAULT leopard')
      })

      it('missing string env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readString(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required string env var "MISSING_ENV" was not supplied.')
      })

      it('string with passing regex validator must be read and log success', () => {
        const INVALID_STRING = 'INVALID_STRING'
        source[INVALID_STRING] = 'too long'

        conf.readString(INVALID_STRING, {validator: /^.{1,5}$/})

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Expected env var "INVALID_STRING" to be match pattern "/^.{1,5}$/" but was "too long" and did not.')
      })

      it('string with failing regex validator must set missingEnvVars to true and log', () => {
        const VALID_STRING = 'VALID_STRING'
        source[VALID_STRING] = 'nice'

        const validString = conf.readString(VALID_STRING, {validator: /^.{1,5}$/})

        validString.must.equal('nice')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var VALID_STRING nice')
      })

      it('must be able to use a string as a validator', () => {
        const INVALID_STRING = 'INVALID_STRING'
        source[INVALID_STRING] = 'too long'

        conf.readString(INVALID_STRING, {validator: '/^.{1,5}$/'})

        errorList.calls[0].must.equal('Expected env var "INVALID_STRING" to be match pattern "/^.{1,5}$/" but was "too long" and did not.')
        conf.missingEnvVars.must.equal(true)
      })
    })

    describe('reading a number', () => {
      it('must be able to read a number and log success', () => {
        const A_GOOD_NUMBER = 'A_GOOD_NUMBER'
        source[A_GOOD_NUMBER] = '123'

        const aGoodNumber = conf.readNumber(A_GOOD_NUMBER)

        aGoodNumber.must.equal(123)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var A_GOOD_NUMBER 123')
      })

      it('must be able to use a default value for a number and report', () => {
        const MISSING_BUT_DEFAULT_NUMBER = 'MISSING_BUT_DEFAULT_NUMBER'

        const missingButDefaultNumber = conf.readNumber(MISSING_BUT_DEFAULT_NUMBER, {defaultValue: 88})

        missingButDefaultNumber.must.equal(88)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default env var MISSING_BUT_DEFAULT_NUMBER 88')
      })

      it('missing number env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readNumber(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required numeric env var "MISSING_ENV" was not supplied.')
      })

      it('badly formated number must set missingEnvVars to true and log', () => {
        const NOT_A_NUMBER = 'NOT_A_NUMBER'
        source[NOT_A_NUMBER] = 'elephant'

        conf.readNumber(NOT_A_NUMBER)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Expected env var "NOT_A_NUMBER" to be numeric but was "elephant".')
      })
    })

    describe('reading a bool', () => {
      it('must be able to read a bool and log success', () => {
        const A_GOOD_BOOL = 'A_GOOD_BOOL'
        source[A_GOOD_BOOL] = 'true'

        const aGoodBool = conf.readBool(A_GOOD_BOOL)

        aGoodBool.must.equal(true)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var A_GOOD_BOOL true')
      })

      ;['t', 'T', 'true', 'TRUE', 'True', 'TrUe', 'on', 'ON', 'On', '1'].forEach(testCase => {
        it(`must read "${testCase}" a "true" bool and log success`, () => {
          const A_GOOD_BOOL = 'A_GOOD_BOOL'
          source[A_GOOD_BOOL] = testCase

          const aGoodBool = conf.readBool(A_GOOD_BOOL)

          aGoodBool.must.equal(true)
          logList.calls.length.must.equal(1)
          errorList.calls.length.must.equal(0)
          logList.calls[0].must.equal('Using env var A_GOOD_BOOL true')
        })
      })

      ;['f', 'F', 'false', 'FALSE', 'False', 'FaLsE', 'off', 'OFF', 'Off', '0'].forEach(testCase => {
        it(`must read "${testCase}" a "false" bool and log success`, () => {
          const A_GOOD_BOOL = 'A_GOOD_BOOL'
          source[A_GOOD_BOOL] = testCase

          const aGoodBool = conf.readBool(A_GOOD_BOOL)

          aGoodBool.must.equal(false)
          logList.calls.length.must.equal(1)
          errorList.calls.length.must.equal(0)
          logList.calls[0].must.equal('Using env var A_GOOD_BOOL false')
        })
      })

      it('must be able to use a default value for a bool and report', () => {
        const MISSING_BUT_DEFAULT_BOOL = 'MISSING_BUT_DEFAULT_BOOL'

        const missingButDefaultBool = conf.readBool(MISSING_BUT_DEFAULT_BOOL, {defaultValue: true})

        missingButDefaultBool.must.equal(true)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default env var MISSING_BUT_DEFAULT_BOOL true')
      })

      it('missing bool env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readBool(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required numeric env var "MISSING_ENV" was not supplied.')
      })

      it('badly formated number must set missingEnvVars to true and log', () => {
        const NOT_A_BOOL = 'NOT_A_BOOL'
        source[NOT_A_BOOL] = 'elephant'

        conf.readBool(NOT_A_BOOL)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Expected env var "NOT_A_BOOL" to be a bool but was "elephant".')
      })
    })

    describe('reading a password', () => {
      it('must be able to read a password and log success with obfuscation', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = 'cheese'

        const happyPath = conf.readPassword(HAPPY_PATH)

        happyPath.must.equal('cheese')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var HAPPY_PATH c****e')
      })

      it('must be able to use a default value for a password and report with obfuscation', () => {
        const MISSING_BUT_DEFAULT_PASSWORD = 'MISSING_BUT_DEFAULT_PASSWORD'

        const missingButDefault = conf.readPassword(MISSING_BUT_DEFAULT_PASSWORD, {defaultValue: 'leopard'})

        missingButDefault.must.equal('leopard')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default MISSING_BUT_DEFAULT_PASSWORD l*****d')
      })

      it('missing password env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readPassword(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required password env var "MISSING_ENV" was not supplied.')
      })
    })

    describe('reading a certificate', () => {
      it('must be able to read a certificate and log success with obfuscation', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = '-----BEGIN CERTIFICATE-----\nABCDEF1234567890\n-----END CERTIFICATE-----'

        const happyPath = conf.readCertificate(HAPPY_PATH)

        happyPath.must.equal('-----BEGIN CERTIFICATE-----\nABCDEF1234567890\n-----END CERTIFICATE-----')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var HAPPY_PATH AB************90')
      })

      it('must be able to use a default value for a certificate and report with obfuscation', () => {
        const MISSING_BUT_DEFAULT_PASSWORD = 'MISSING_BUT_DEFAULT_PASSWORD'

        const missingButDefault = conf.readCertificate(MISSING_BUT_DEFAULT_PASSWORD, {defaultValue: 'leopard'})

        missingButDefault.must.equal('leopard')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default MISSING_BUT_DEFAULT_PASSWORD l*****d')
      })

      it('missing certificate env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readCertificate(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required certificate env var "MISSING_ENV" was not supplied.')
      })
    })

    describe('reading a url', () => {
      it('must be able to read a url and log success', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = 'https://host.com:123/path?q=v#hash'

        const happyPath = conf.readUrl(HAPPY_PATH)

        happyPath.must.equal('https://host.com:123/path?q=v#hash')
        conf.missingEnvVars.must.equal(false)
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var HAPPY_PATH https://host.com:123/path?q=v#hash')
      })

      it('must not obfuscate usernames', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = 'https://username@host.com:123/path?q=v#hash'

        conf.readUrl(HAPPY_PATH)
        logList.calls[0].must.equal('Using env var HAPPY_PATH https://username@host.com:123/path?q=v#hash')
      })

      it('must be able to obfuscating passwords', () => {
        const HAPPY_PATH = 'HAPPY_PATH'
        source[HAPPY_PATH] = 'https://username:password@host.com:123/path?q=v#hash'

        conf.readUrl(HAPPY_PATH)
        logList.calls[0].must.equal('Using env var HAPPY_PATH https://username:p******d@host.com:123/path?q=v#hash')
      })

      it('must be able to use a default value for a url and report', () => {
        const MISSING_BUT_DEFAULT = 'MISSING_BUT_DEFAULT'

        const missingButDefault = conf.readUrl(MISSING_BUT_DEFAULT, {defaultValue: 'http://username:password@host.com/path'})

        missingButDefault.must.equal('http://username:password@host.com/path')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using default MISSING_BUT_DEFAULT http://username:p******d@host.com/path')
      })

      it('missing url env vars must set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV'

        conf.readUrl(MISSING_ENV)

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(0)
        errorList.calls.length.must.equal(1)
        errorList.calls[0].must.equal('Required url env var "MISSING_ENV" was not supplied.')
      })
    })

    describe('reading a string with fallbacks', () => {
      it('must be able to read a string from the first opton', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[FIRST] = 'alpha'
        source[SECOND] = 'beta'

        const readFirst = conf.readString([FIRST, SECOND])

        conf.missingEnvVars.must.equal(false)
        readFirst.must.equal('alpha')
        logList.calls.length.must.equal(1)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Using env var FIRST alpha')
      })

      it('must be able to read a string from the second option if the first is missing', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[SECOND] = 'beta'

        const readSecond = conf.readString([FIRST, SECOND])

        conf.missingEnvVars.must.equal(false)
        readSecond.must.equal('beta')
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use string "FIRST".')
        logList.calls[1].must.equal('Using env var SECOND beta')
      })

      it('must give an error if non of the fall backs exist', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'

        conf.readString([FIRST, SECOND])

        conf.missingEnvVars.must.equal(true)
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(1)
        logList.calls[0].must.equal('Could not use string "FIRST".')
        logList.calls[1].must.equal('Could not use string "SECOND".')
        errorList.calls[0].must.equal('At least one of required strings "FIRST" or "SECOND" was not supplied.')
      })

      it('must use default if non of the fall backs exist', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'

        const readFirstSecond = conf.readString([FIRST, SECOND], {defaultValue: 'gamma'})

        conf.missingEnvVars.must.equal(false)
        readFirstSecond.must.equal('gamma')
        logList.calls.length.must.equal(3)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use string "FIRST".')
        logList.calls[1].must.equal('Could not use string "SECOND".')
        logList.calls[2].must.equal(`Using default for [ 'FIRST', 'SECOND' ] gamma`)
      })

      it('must be able to read a string from the second option if the first is non valid', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[FIRST] = 'alpha'
        source[SECOND] = 'beta'

        const readSecond = conf.readString([FIRST, SECOND], {validator: /^b.+$/})

        conf.missingEnvVars.must.equal(false)
        readSecond.must.equal('beta')
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use string "FIRST".')
        logList.calls[1].must.equal('Using env var SECOND beta')
      })
    })

    describe('reading a number with fallbacks', () => {
      it('must be able to read a number from the second option if the first is missing', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[SECOND] = '2'

        const readSecond = conf.readNumber([FIRST, SECOND])

        conf.missingEnvVars.must.equal(false)
        readSecond.must.equal(2)
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use number "FIRST".')
        logList.calls[1].must.equal('Using env var SECOND 2')
      })

      it('must be able to read a number from the second option if the first is non valid', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[FIRST] = 'cheese'
        source[SECOND] = '2'

        const readSecond = conf.readNumber([FIRST, SECOND])

        conf.missingEnvVars.must.equal(false)
        readSecond.must.equal(2)
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use number "FIRST".')
        logList.calls[1].must.equal('Using env var SECOND 2')
      })
    })

    describe('reading a password with fallbacks', () => {
      it('must be able to read a number from the second option if the first is missing', () => {
        const FIRST = 'FIRST'
        const SECOND = 'SECOND'
        source[SECOND] = 'supercalifragilisticexpialidocious'

        const readSecond = conf.readPassword([FIRST, SECOND])

        conf.missingEnvVars.must.equal(false)
        readSecond.must.equal('supercalifragilisticexpialidocious')
        logList.calls.length.must.equal(2)
        errorList.calls.length.must.equal(0)
        logList.calls[0].must.equal('Could not use password "FIRST".')
        logList.calls[1].must.equal('Using env var SECOND sup****************************ous')
      })
    })
  })

  describe('extra features', () => {
    it('must export deepFreeze functionality', () => {
      conf.makeClonableAndDeepFreeze.must.be.a.function()
    })
  })
})

describe('obfuscate', () => {
  var conf

  beforeEach(() => {
    conf = require('../index.js')
  })

  describe('totally masking passwords less than 6 characters long', () => {
    [
      {in: '1', out: '*'},
      {in: '12', out: '**'},
      {in: '123', out: '***'},
      {in: '1234', out: '****'},
      {in: '12345', out: '*****'}
    ].forEach(testCase => {
      it('must mask ' + testCase.in + ' to ' + testCase.out, () => {
        const obfusicated = conf.obfuscate(testCase.in)
        obfusicated.must.equal(testCase.out)
      })
    })
  })

  describe('partial masking passwords 6 characters or longer', () => {
    [
      {in: '123456', out: '1****6'},
      {in: '1234567', out: '1*****7'},
      {in: '12345678', out: '1******8'},
      {in: '123456789', out: '1*******9'},
      {in: '123456789A', out: '1********A'},
      {in: '123456789AB', out: '1*********B'},
      {in: '123456789ABC', out: '12********BC'},
      {in: '123456789ABCD', out: '12*********CD'},
      {in: '123456789ABCDE', out: '12**********DE'},
      {in: '123456789ABCDEF', out: '12***********EF'}
    ].forEach(testCase => {
      it('must mask ' + testCase.in + ' to ' + testCase.out, () => {
        const conf = require('../index.js')
        const obfusicated = conf.obfuscate(testCase.in)
        obfusicated.must.equal(testCase.out)
      })
    })
  })

  describe('a url', () => {
    it('must not mind if auth is missing', () => {
      const url = 'http://host.com/'
      const obfusicated = conf.obfuscateAuth(url)
      obfusicated.must.equal('http://host.com/')
    })

    it('must not obfuscate username', () => {
      const url = 'http://username@host.com/'
      const obfusicated = conf.obfuscateAuth(url)
      obfusicated.must.equal('http://username@host.com/')
    })

    it('must totally mask password less than 6 chars', () => {
      const url = 'http://user:pass@host.com/'
      const obfusicated = conf.obfuscateAuth(url)
      obfusicated.must.equal('http://user:****@host.com/')
    })

    it('must partial mask password 6 chars or longer', () => {
      const url = 'http://username:password@host.com/'
      const obfusicated = conf.obfuscateAuth(url)
      obfusicated.must.equal('http://username:p******d@host.com/')
    })
  })

  describe('a certificate', () => {
    it('must remove the header, footer and most of the body', () => {
      const certificate = '-----BEGIN CERTIFICATE-----\nABCDEF1234567890\n-----END CERTIFICATE-----'
      const obfusicated = conf.obfuscateCertificate(certificate)
      obfusicated.must.equal('AB************90')
    })

    it('must combine key onto one line', () => {
      const certificate = '-----BEGIN CERTIFICATE-----\nABCDEF12\n34567890\n-----END CERTIFICATE-----'
      const obfusicated = conf.obfuscateCertificate(certificate)
      obfusicated.must.equal('AB************90')
    })

    it('must not mind of the footer and/or header are missing', () => {
      const certificate = `ABCDEF1234567890`
      const obfusicated = conf.obfuscateCertificate(certificate)
      obfusicated.must.equal('AB************90')
    })

    it('must keep the output less than 30 characters', () => {
      const certificate = `0123456789012345678901234567890123456789`
      const obfusicated = conf.obfuscateCertificate(certificate)
      obfusicated.must.equal('012**********...**********789')
    })
  })
})

describe('SpConfig', () => {
  it('must be able to use two validators independently', () => {
    delete require.cache[require.resolve('../index.js')]
    const SpConf = require('../index.js')

    const VAR_A = 'VAR_A'
    const VAR_B = 'VAR_B'

    const commonSource = {
      VAR_A: 'good'
    }

    const logListA = new LoggingLogger()
    const errorListA = new LoggingLogger()
    const logListB = new LoggingLogger()
    const errorListB = new LoggingLogger()

    const confA = new SpConf({
      log: logListA.log.bind(logListA),
      error: errorListA.log.bind(errorListA),
      source: commonSource
    })

    const confB = new SpConf({
      log: logListB.log.bind(logListB),
      error: errorListB.log.bind(errorListB),
      source: commonSource
    })

    const confATest = confA.readString(VAR_A)
    confB.readString(VAR_B)

    confATest.must.equal('good')
    confA.missingEnvVars.must.equal(false)
    logListA.calls.length.must.equal(1)
    errorListA.calls.length.must.equal(0)
    logListA.calls[0].must.equal('Using env var VAR_A good')

    confB.missingEnvVars.must.equal(true)
    logListB.calls.length.must.equal(0)
    errorListB.calls.length.must.equal(1)
    errorListB.calls[0].must.equal('Required string env var "VAR_B" was not supplied.')
  })
})
