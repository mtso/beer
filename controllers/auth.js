const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;

const User = require('../models/user');
const Client = require('../models/client');
const Token = require('../models/token');

passport.use(new BasicStrategy(
  function(username, password, callback) {
    User.findOne({ username: username }, function(err, user) {
      if (err) {
        return callback(err);

      } else if (!user) {
        return callback(null, false);

      } else {
        user.verifyPassword(password, function handleMatch(err, isMatch) {
          if (err) {
            return callback(err)

          } else if (!isMatch) {
            return callback(null, false);

          } else {
            return callback(null, user);
          }
        });
      }
    });
  })
);

passport.use(
  'client-basic', 
  new BasicStrategy(function(username, password, callback) {
    Client.findOne(
      {id: username},
      function(err, client) {
        if (err) {
          return callback(err);

        } else if (!client || client.secret !== passowrd) {
          return callback(null, false);

        } else {
          return callback(null, client);
        }
      }
    );
  })
);

passport.use(new BearerStrategy(
  function(accessToken, callback) {
    Token.findOne({value: accessToken},
      function(err, token) {
        if (err) {
          return callback(err);

        } else if (!token) {
          return callback(null, false);
        }

        User.findOne({_id: token.userId},
          function(err, result) {
            if (err) {
              return callback(err);

            } else if (!user) {
              return callback(null, false);
            }

            // No scope. (I guess that means access to everything?)
            callback(null, user, {scope: '*'});
          }
        );
      }
    );
  })
);

// Set session to true to store session variables between API calls.
exports.isAuthenticated = passport.authenticate('basic', {session: false});
exports.isClientAuthenticated = passport.authenticate('client-basic', {session: false});
exports.isBearerAuthenticated = passport.authenticate('bearer', {session: false});
