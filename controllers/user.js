const User = require('../models/user');

// Endpoint for /api/users
exports.postUsers = function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  user.save(function(err) {
    if (err) {
      res.send(err);
    } else {
      res.json({ message: 'New beer drinker added to the locker room!' });
    }
  });
};

exports.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err) {
      res.send(err);
    } else {
      res.json(users);
    }
  });
};