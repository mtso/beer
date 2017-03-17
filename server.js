const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const Beer = require('./models/beer');

const app = express();
const port = process.env.PORT || 7500;
const router = express.Router();

app.use(bodyParser.urlencoded({
  extended: true
}));

mongoose.connect('mongodb://localhost:27017/beerstore');

router.get('/', function(req, res) {
  res.json({message: 'You are running dangerously low on beer!'});
});

const beersRoute = router.route('/beers');

beersRoute.post(function(req, res) {
  var beer = new Beer();
  beer.name = req.body.name;
  beer.type = req.body.type;
  beer.quantity = req.body.quantity;

  beer.save(function(err) {
    if (err) {
      res.send(err);
    } else {
      res.json({
        message: 'Beer added to the locker!',
        data: beer
      });
    }
  });
});

beersRoute.get(function(req, res) {
  Beer.find(function(err, beers) {
    if (err) {
      res.send(err);
    } else {
      res.json(beers);
    }
  });
});

const beerRoute = router.route('/beers/:beer_id');

beerRoute.get(function(req, res) {
  Beer.findById(req.params.beer_id, function(err, beer) {
    if (err) {
      res.send(err);
    } else {
      res.json(beer);
    }
  });
});

beerRoute.put(function(req, res) {

});

beerRoute.delete(function(req, res) {

});

app.use('/api', router);

app.listen(port);
console.log('Insert beer on port ' + port);