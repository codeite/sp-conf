"strict mode";
const chai = require('chai');

const LoggingLogger = require('./helpers/loggingLogger');
chai.should();

describe('sp-config', () => {
  var conf, logList, errorList;

  beforeEach(() => {
    delete require.cache[require.resolve('../index.js')];
    conf = require('../index.js');
    logList = new LoggingLogger();
    errorList = new LoggingLogger();

    conf.defaultOptions = {
      log: logList.log.bind(logList),
      error: errorList.log.bind(errorList)
    };
  });

  describe('reading from the environment', () => {
    it('should be able to read from the environment', () => {
      const SP_CONFIG_TEST = 'SP_CONFIG_TEST';
      process.env[SP_CONFIG_TEST] = 'the test is good';

      const spConfigTest = conf.readString(SP_CONFIG_TEST);

      spConfigTest.should.equal('the test is good');
    });
  });

  describe('reading from an object source', () => {
    var source;

    beforeEach(() => {
      source = {};
      conf.defaultOptions.source = source;
    });

    describe('reading a string', ()=> {
      it('should be able to read a string and log success', () => {
        const HAPPY_PATH = 'HAPPY_PATH';
        source[HAPPY_PATH] = 'cheese';

        const happyPath = conf.readString(HAPPY_PATH);

        happyPath.should.equal('cheese');
        conf.missingEnvVars.should.eq(false);
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var HAPPY_PATH cheese');
      });

      it('should be able to use a default value for a string and report', () => {
        const MISSING_BUT_DEFAULT = 'MISSING_BUT_DEFAULT';

        const missingButDefault = conf.readString(MISSING_BUT_DEFAULT, {defaultValue: 'leopard'});

        missingButDefault.should.equal('leopard');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using default MISSING_BUT_DEFAULT leopard');
      });

      it('missing string env vars should set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV';

        const sadPath = conf.readString(MISSING_ENV);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Required string env var "MISSING_ENV" was not supplied.');
      });

      it('string with passing regex validator should be read and log success', () => {
        const INVALID_STRING = 'INVALID_STRING';
        source[INVALID_STRING] = "too long";

        conf.readString(INVALID_STRING, {validator: /^.{1,5}$/});

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Expected env var "INVALID_STRING" to be match pattern "/^.{1,5}$/" but was "too long" and did not.');
      });

      it('string with failing regex validator should set missingEnvVars to true and log', () => {
        const VALID_STRING = 'VALID_STRING';
        source[VALID_STRING] = "nice";

        const validString = conf.readString(VALID_STRING, {validator: /^.{1,5}$/});

        validString.should.equal('nice');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var VALID_STRING nice');
      });

      it('should be able to use a string as a validator', () => {
        const INVALID_STRING = 'INVALID_STRING';
        source[INVALID_STRING] = "too long";

        conf.readString(INVALID_STRING, {validator: "/^.{1,5}$/"});

        errorList.calls[0].should.equal('Expected env var "INVALID_STRING" to be match pattern "/^.{1,5}$/" but was "too long" and did not.');
        conf.missingEnvVars.should.eq(true);
      });

    });

    describe('reading a number', ()=> {
      it('should be able to read a number and log success', () => {
        const A_GOOD_NUMBER = 'A_GOOD_NUMBER';
        source[A_GOOD_NUMBER] = "123";

        const aGoodNumber = conf.readNumber(A_GOOD_NUMBER);

        aGoodNumber.should.equal(123);
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var A_GOOD_NUMBER 123');
      });

      it('should be able to use a default value for a number and report', () => {
        const MISSING_BUT_DEFAULT_NUMBER = 'MISSING_BUT_DEFAULT_NUMBER';

        const missingButDefaultNumber = conf.readString(MISSING_BUT_DEFAULT_NUMBER, {defaultValue: 88});

        missingButDefaultNumber.should.equal(88);
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using default MISSING_BUT_DEFAULT_NUMBER 88');
      });

      it('missing number env vars should set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV';

        const sadPath = conf.readNumber(MISSING_ENV);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Required numeric env var "MISSING_ENV" was not supplied.');
      });

      it('badly formated number should set missingEnvVars to true and log', () => {
        const NOT_A_NUMBER = 'NOT_A_NUMBER';
        source[NOT_A_NUMBER] = "elephant";

        conf.readNumber(NOT_A_NUMBER);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Expected env var "NOT_A_NUMBER" to be numeric but was "elephant".');
      });
    });

    describe('reading a password', ()=> {
      it('should be able to read a password and log success with obfuscation', () => {
        const HAPPY_PATH = 'HAPPY_PATH';
        source[HAPPY_PATH] = 'cheese';

        const happyPath = conf.readPassword(HAPPY_PATH);

        happyPath.should.equal('cheese');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var HAPPY_PATH c****e');
      });

      it('should be able to use a default value for a password and report with obfuscation', () => {
        const MISSING_BUT_DEFAULT_PASSWORD = 'MISSING_BUT_DEFAULT_PASSWORD';

        const missingButDefault = conf.readPassword(MISSING_BUT_DEFAULT_PASSWORD, {defaultValue: 'leopard'});

        missingButDefault.should.equal('leopard');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using default MISSING_BUT_DEFAULT_PASSWORD l*****d');
      });

      it('missing password env vars should set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV';

        const sadPath = conf.readPassword(MISSING_ENV);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Required password env var "MISSING_ENV" was not supplied.');
      });
    });

    describe('reading a url', ()=> {
      it('should be able to read a url and log success', () => {
        const HAPPY_PATH = 'HAPPY_PATH';
        source[HAPPY_PATH] = 'https://host.com:123/path?q=v#hash';

        const happyPath = conf.readUrl(HAPPY_PATH);

        happyPath.should.equal('https://host.com:123/path?q=v#hash');
        conf.missingEnvVars.should.eq(false);
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var HAPPY_PATH https://host.com:123/path?q=v#hash');
      });

      it('should not obfuscate usernames', () => {
        const HAPPY_PATH = 'HAPPY_PATH';
        source[HAPPY_PATH] = 'https://username@host.com:123/path?q=v#hash';

        const happyPath = conf.readUrl(HAPPY_PATH);
        logList.calls[0].should.equal('Using env var HAPPY_PATH https://username@host.com:123/path?q=v#hash');
      });

      it('should be able to obfuscating passwords', () => {
        const HAPPY_PATH = 'HAPPY_PATH';
        source[HAPPY_PATH] = 'https://username:password@host.com:123/path?q=v#hash';

        const happyPath = conf.readUrl(HAPPY_PATH);
        logList.calls[0].should.equal('Using env var HAPPY_PATH https://username:p******d@host.com:123/path?q=v#hash');
      });

      it('should be able to use a default value for a url and report', () => {
        const MISSING_BUT_DEFAULT = 'MISSING_BUT_DEFAULT';

        const missingButDefault = conf.readUrl(MISSING_BUT_DEFAULT, {defaultValue: 'http://username:password@host.com/path'});

        missingButDefault.should.equal('http://username:password@host.com/path');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using default MISSING_BUT_DEFAULT http://username:p******d@host.com/path');
      });

      it('missing url env vars should set missingEnvVars to true and log', () => {
        const MISSING_ENV = 'MISSING_ENV';

        const sadPath = conf.readUrl(MISSING_ENV);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(0);
        errorList.calls.length.should.eq(1);
        errorList.calls[0].should.equal('Required url env var "MISSING_ENV" was not supplied.');
      });
    });

    describe('reading a string with fallbacks', ()=> {
      it('should be able to read a string from the first opton', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[FIRST] = 'alpha';
        source[SECOND] = 'beta';

        const readFirst = conf.readString([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(false);
        readFirst.should.equal('alpha');
        logList.calls.length.should.eq(1);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Using env var FIRST alpha');

      });

      it('should be able to read a string from the second option if the first is missing', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[SECOND] = 'beta';

        const readSecond = conf.readString([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(false);
        readSecond.should.equal('beta');
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use string "FIRST".');
        logList.calls[1].should.equal('Using env var SECOND beta');

      });

      it('should give an error if non of the fall backs exist', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';

        conf.readString([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(true);
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(1);
        logList.calls[0].should.equal('Could not use string "FIRST".');
        logList.calls[1].should.equal('Could not use string "SECOND".');
        errorList.calls[0].should.equal('At least one of required strings "FIRST" or "SECOND" was not supplied.');

      });

      it('should use default if non of the fall backs exist', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';

        const readFirstSecond = conf.readString([FIRST, SECOND], {defaultValue: 'gamma'});

        conf.missingEnvVars.should.eq(false);
        readFirstSecond.should.equal('gamma');
        logList.calls.length.should.eq(3);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use string "FIRST".');
        logList.calls[1].should.equal('Could not use string "SECOND".');
        logList.calls[2].should.equal(`Using default for [ 'FIRST', 'SECOND' ] gamma`);
      });

      it('should be able to read a string from the second option if the first is non valid', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[FIRST] = 'alpha';
        source[SECOND] = 'beta';

        const readSecond = conf.readString([FIRST, SECOND], {validator: /^b.+$/});

        conf.missingEnvVars.should.eq(false);
        readSecond.should.equal('beta');
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use string "FIRST".');
        logList.calls[1].should.equal('Using env var SECOND beta');

      });
    });

    describe('reading a number with fallbacks', ()=> {
      it('should be able to read a number from the second option if the first is missing', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[SECOND] = '2';

        const readSecond = conf.readNumber([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(false);
        readSecond.should.equal(2);
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use number "FIRST".');
        logList.calls[1].should.equal('Using env var SECOND 2');

      });

      it('should be able to read a number from the second option if the first is non valid', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[FIRST] = 'cheese';
        source[SECOND] = '2';

        const readSecond = conf.readNumber([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(false);
        readSecond.should.equal(2);
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use number "FIRST".');
        logList.calls[1].should.equal('Using env var SECOND 2');

      });
    });

    describe('reading a password with fallbacks', ()=> {
      it('should be able to read a number from the second option if the first is missing', () => {
        const FIRST = 'FIRST';
        const SECOND = 'SECOND';
        source[SECOND] = 'supercalifragilisticexpialidocious';

        const readSecond = conf.readPassword([FIRST, SECOND]);

        conf.missingEnvVars.should.eq(false);
        readSecond.should.equal('supercalifragilisticexpialidocious');
        logList.calls.length.should.eq(2);
        errorList.calls.length.should.eq(0);
        logList.calls[0].should.equal('Could not use password "FIRST".');
        logList.calls[1].should.equal('Using env var SECOND sup****************************ous');

      });

    });
  });
});

describe('obfuscate', () => {
  var conf;

  beforeEach(() => {
    conf = require('../index.js');
  });

  describe('totally masking passwords less than 6 characters long', () => {
    [
      {in:'1', out:'*'},
      {in:'12', out:'**'},
      {in:'123', out:'***'},
      {in:'1234', out:'****'},
      {in:'12345', out:'*****'}
    ].forEach(testCase => {
      it('should mask '+testCase.in+' to '+testCase.out, () => {
        const obfusicated = conf.obfuscate(testCase.in);
        obfusicated.should.equal(testCase.out);
      })
    });
  });

  describe('partial masking passwords 6 characters or longer', () => {
    [
      {in:'123456', out:'1****6'},
      {in:'1234567', out:'1*****7'},
      {in:'12345678', out:'1******8'},
      {in:'123456789', out:'1*******9'},
      {in:'123456789A', out:'1********A'},
      {in:'123456789AB', out:'1*********B'},
      {in:'123456789ABC', out:'12********BC'},
      {in:'123456789ABCD', out:'12*********CD'},
      {in:'123456789ABCDE', out:'12**********DE'},
      {in:'123456789ABCDEF', out:'12***********EF'}
    ].forEach(testCase => {
      it('should mask '+testCase.in+' to '+testCase.out, () => {
        const conf = require('../index.js');
        const obfusicated = conf.obfuscate(testCase.in);
        obfusicated.should.equal(testCase.out);
      })
    });
  });

  describe('a url', () => {
    it('should not mind if auth is missing', () => {
      const url = 'http://host.com/';
      const obfusicated = conf.obfuscateAuth(url);
      obfusicated.should.equal('http://host.com/')
    });

    it('should not obfuscate username', () => {
      const url = 'http://username@host.com/';
      const obfusicated = conf.obfuscateAuth(url);
      obfusicated.should.equal('http://username@host.com/')
    });

    it('should totally mask password less than 6 chars', () => {
      const url = 'http://user:pass@host.com/';
      const obfusicated = conf.obfuscateAuth(url);
      obfusicated.should.equal('http://user:****@host.com/')
    });

    it('should partial mask password 6 chars or longer', () => {
      const url = 'http://username:password@host.com/';
      const obfusicated = conf.obfuscateAuth(url);
      obfusicated.should.equal('http://username:p******d@host.com/')
    });
  });
})

describe('SpConfig', () => {
  it('should be able to use two validators independently', () => {
    delete require.cache[require.resolve('../index.js')];
    SpConf = require('../index.js');

    const VAR_A = 'VAR_A';
    const VAR_B = 'VAR_B';

    const commonSource = {
      VAR_A: 'good'
    };

    logListA = new LoggingLogger();
    errorListA = new LoggingLogger();
    logListB = new LoggingLogger();
    errorListB = new LoggingLogger();

    const confA = new SpConf({
      log: logListA.log.bind(logListA),
      error: errorListA.log.bind(errorListA),
      source: commonSource
    });

    const confB = new SpConf({
      log: logListB.log.bind(logListB),
      error: errorListB.log.bind(errorListB),
      source: commonSource
    });

    const confATest = confA.readString(VAR_A);
    confB.readString(VAR_B);

    confATest.should.equal('good');
    confA.missingEnvVars.should.eq(false);
    logListA.calls.length.should.eq(1);
    errorListA.calls.length.should.eq(0);
    logListA.calls[0].should.equal('Using env var VAR_A good');

    confB.missingEnvVars.should.eq(true);
    logListB.calls.length.should.eq(0);
    errorListB.calls.length.should.eq(1);
    errorListB.calls[0].should.equal('Required string env var "VAR_B" was not supplied.');
  });
});
