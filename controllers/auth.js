const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const User = require('../models/user');

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
  }));

// Set session to true to store session variables between API calls.
exports.isAuthenticated = passport.authenticate('basic', {session: false});