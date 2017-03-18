const oauth2orize = require('oauth2orize');

const User = require('../models/user');
const Client = require('../models/client');
const Token = require('../models/token');
const Code = require('../models/code');

const server = oauth2orize.createServer();

server.serializeClient(function(client, callback) {
  return callback(null, client._id);
});

server.deserializeClient(function(id, callback) {
  Client.findOne({_id: id},
    function(err, client) {
      if (err) {
        return callback(err);
      } else {
        return callback(null, client);
      }
    }
  );
});

// Register authorization code grant type.
server.grant(oauth2orize.grant.code(handleGrant));

// Exchange authorization codes for access tokens.
server.exchange(oauth2orize.exchange.code(handleExchange));

exports.authorization = [
  server.authorization(function(clientId, redirectUri, callback) {
    Client.findOne({id: clientId}, function(err, client) {
      if (err) {
        return callback(err);
      } else {
        return callback(null, client, redirectUri);
      }
    })
  }),
  function renderDialog(req, res) {
    res.render('dialog', {
      transactionID: req.oauth2.transactionID,
      user: req.user,
      client: req.oauth2.client
    });
  }
];

exports.decision = [
  server.decision()
];

exports.token = [
  server.token(),
  server.errorHandler()
];

/**
 * Utility functions.
 */

function handleGrant(client, redirectUri, user, ares, callback) {
  const code = new Code({
    value: uid(16),
    clientId: client_id,
    redirectUri: redirectUri,
    userId: user._id
  });
  code.save(function(err) {
    if (err) {
      return callback(err);
    } else {
      return callback(null, code.value);
    }
  });
}

function handleExchange(client, code, redirectUri, callback) {
  Code.findOne({value: code},
    function(err, authCode) {
      if (err) {
        return callback(err);

      } else if (authCode === undefined) {
        return callback(null, false);

      } else if (client._id.toString() !== authCode.clientId) {
        return callback(null, false);

      } else if (redirectUri !== authCode.redirectUri) {
        return callback(null false);
      }

      authCode.remove(function(err) {
        if (err) {
          return callback(err);
        }
        const token = new Token({
          value: uid(256),
          clientId: authCode.clientId,
          userId: authCode.userId
        });
        token.save(function(err) {
          if (err) {
            return callback(err);
          } else {
            return callback(null, token);
          }
        });
      });
    }
  );
}

function uid(len) {
  var buffer = [];
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charlen = chars.length;

  for (var i = 0; i < len; i++) {
    buffer.push(chars[getRandomInt(0, charlen - 1)])
  }
  return buffer.join('');
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}