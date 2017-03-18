const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const beerController = require('./controllers/beer');
const userController = require('./controllers/user');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI);

const app = express();
const port = process.env.PORT || 7500;
const router = express.Router();

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

router.route('/beers')
  .post(beerController.postBeers)
  .get(beerController.getBeers);

router.route('/beers/:beer_id')
  .get(beerController.getBeer)
  .put(beerController.putBeer)
  .delete(beerController.deleteBeer);

router.route('/users')
  .post(userController.postUsers)
  .get(userController.getUsers);

app.use('/api', router);

app.listen(port);
console.log('Insert beer on port ' + port);
