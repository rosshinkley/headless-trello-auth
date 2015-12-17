var Nightmare = require('nightmare'),
  prompt = require('co-prompt'),
  vo = require('vo'),
  uuid = require('uuid'),
  debug = require('debug')('headless-trello-auth');

var auth = function * (options) {
  debug('starting');
  var nightmare = new Nightmare({
      'show': true,
      'skip-taskbar': true,
      'web-preferences': {
        partition: 'persist:' + uuid.v4()
      }
    });

  debug('options check');
  if (!options.username) {
      throw new Error('No username specified.');
  }
  if (!options.password) {
      throw new Error('No password specified.');
  }
  if (!options.scopes) {
      throw new Error('No Trello auth scopes specified.');
  }
  if (!options.applicationName) {
      throw new Error('No application name specified.');
  }

  debug('logging in');
  yield nightmare
    .useragent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.56 Safari/536.5')
    .goto('https://trello.com/login')
    .wait('#user')
    .type('#user', options.username)
    .type('#password', options.password)
    .click('#login')
    .wait(500);

  //check bad username/password
  if((yield nightmare.visible('.error-message'))){
    throw new Error(yield nightmare.evaluate(function(){
      return document.querySelector('.error-message').textContent;
    }));
  }

  debug('checking two-factor');
  var twoFactorEnabled = yield nightmare
    .wait(3000)
    .visible('#sms');

  if (twoFactorEnabled) {
    if (options.noPrompts) {
      throw new Error('two-factor authentication enabled, must either enable prompts or turn off two-factor authentication');
    }
    var sms = yield prompt('enter sms verification: ');
    yield nightmare
      .type('#sms', sms)
      .click('#login')
      .wait(1000);

    //check failure of sms code
    if((yield nightmare.visible('.error-message'))){
      throw new Error(yield nightmare.evaluate(function(){
        return document.querySelector('.error-message').textContent;
      }));
    }
  }

  debug('getting API keys');
  options.key = (yield nightmare
    .goto('https://trello.com/app-key')
    .evaluate(function() {
      return {
        key: document.querySelector('#key').value,
        secret: document.querySelector('#secret').value
      };
    })).key;

  debug('getting authorization token');
  var token = yield nightmare
    .goto(`https://trello.com/1/authorize?key=${options.key}&name=${options.applicationName}&expiration=never&response_type=token&scope=${options.scopes}`)
    .click('input[name="approve"]')
    .wait('pre')
    .evaluate(function() {
      return document.querySelector('pre').textContent;
    });

  yield nightmare.end();

  return token;
};

module.exports = exports = function(options, cb) {
  var p = new Promise(function(resolve, reject) {
    debug('starting login');
    vo(auth)(options, function(err, token) {
      debug(`finished, token=${token}`);
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });

  if(cb){
    p.then(function(token) {
      cb(null, token);
    }).catch(function(err) {
      cb(err);
    });
  } else {
    return p;
  }
};
