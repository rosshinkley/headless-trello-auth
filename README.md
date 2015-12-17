Log into a Trello account and get an authorization token for the Trello API.

## Installation

Use `npm`: `npm install headless-trello-auth`

### Quick Aside About NightmareJS

[Nightmare](https://github.com/segmentio/nightmare) is a browser automation toolkit based on [Electron](https://github.com/atom/electron).  Nightmare is installable and usable via NPM natively.  For most cases, it will Just Work (tm) out of the box.

However, Electron requires a video buffer to be available.  If you are using this library on a headless system (eg, a server with no X client,  a Docker instance, or a chroot under Crouton), you will need to use a virtual framebuffer to get this library working.  More information about this [can be found in the Nightmare repository's issues.](https://github.com/segmentio/nightmare/issues/224)

## Options

The exposed method takes an options hash:

* **username** - the email address to log into.
* **password** - the password for the account.
* **scopes** - scopes to request for the logging in user.  Note that anything specified here is automatically granted.
* **applicationName** - the name of the application to grant access for.  This can be revoked from user settings at any time.
* **noPrompts** - forces an exception if 2-factor authentication is detected.

The callback (or promise resolution) passes up the newly minted token from Trello.

## Usage

### Callbacks

Say you wanted to add a card using the [Trello API wrapper](https://github.com/norberteder/trello):

```javascript
var headlessAuth = require('headless-trello-auth');
headlessAuth({
    username: 'user@example.com',
    password: 'MySuperSecretPassword',
    scopes: 'read,write',
    applicationName: 'headless-auth-test'
}, function(err, token){
    trello = new (require('trello'))('[application key]', token);
    trello.addCard('Clean car', 'Wax on, wax off', listId,
        function(err, trelloCard){
            if(err){
                console.log('Could not add card: ', err);
            } else {
                console.log('added card: ', trelloCard);
            }
        });
});
```

### Promises

If you wanted to use promises instead, using the same example as above:

```javascript
var headlessAuth = require('headless-trello-auth');
var promise = headlessAuth({
    username: 'user@example.com',
    password: 'MySuperSecretPassword',
    scopes: 'read,write',
    applicationName: 'headless-auth-test'
}); 

//... other code as needed ...

promise.then(function(token){
    trello = new (require('trello'))('[application key]', token);
    trello.addCard('Clean car', 'Wax on, wax off', listId,
        function(err, trelloCard){
            if(err){
                console.log('Could not add card: ', err);
            } else {
                console.log('added card: ', trelloCard);
            }
        });
});
```

### Two-Factor Authentication
If two-factor authentication is required and detected, there will be a prompt for the SMS code unless `noPrompts` is specified.
