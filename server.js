/**
 * Import packages
 */

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');

/**
 * Import controllers
 */

const authController = require('./controllers/auth');
const beerController = require('./controllers/beer');
const userController = require('./controllers/user');
const clientController = require('./controllers/client');
const oauth2Controller = require('./controllers/oauth2');

// Connect mongoose to mongodb.
mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);

/**
 * App Setup
 */

const app = express();

app.set('view engine', 'ejs');

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

// OAuth2orize requires express session.
app.use(session({
  secret: 'Super Secret Session Key',
  saveUninitialized: true,
  resave: true
}));

app.use(passport.initialize());

/**
 * Add Routes
 */

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
  .get(isAuthenticated, userController.getUsers);

router.route('/clients')
  .post(isAuthenticated, clientController.postClients)
  .get(isAuthenticated, clientController.getClients);

router.route('/oauth2/authorize')
  .get(isAuthenticated, oauth2Controller.authorization)
  .post(isAuthenticated, oauth2Controller.decision);

router.route('/oauth2/token')
  .post(authController.isClientAuthenticated, oauth2Controller.token);

app.use('/api', router);

/**
 * Listen and Serve
 */
const port = process.env.PORT || 7500;
app.listen(port);
console.log('Insert beer on port ' + port);

exports = module.exports = app;