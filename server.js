const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const authController = require('./controllers/auth');
const beerController = require('./controllers/beer');
const userController = require('./controllers/user');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(passport.initialize());

const router = express.Router();
const isAuthenticated = authController.isAuthenticated;

router.route('/beers')
  .post(isAuthenticated, beerController.postBeers)
  .get(isAuthenticated, beerController.getBeers);

router.route('/beers/:beer_id')
  .get(isAuthenticated, beerController.getBeer)
  .put(isAuthenticated, beerController.putBeer)
  .delete(isAuthenticated, beerController.deleteBeer);

router.route('/users')
  .post(userController.postUsers)
  .get(authController.isAuthenticated, userController.getUsers);

app.use('/api', router);

const port = process.env.PORT || 7500;
app.listen(port);
console.log('Insert beer on port ' + port);
