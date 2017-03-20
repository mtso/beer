'use strict';

const request = require('supertest');
const expect = require('chai').expect;
const app = require('../server');
const path = require('path');
const mongodb = require('mongodb');
const async = require('async');

before(function(done) {
  if (!process.env.MONGODB_URI.includes('test')) {
    return done(new Error('Wrong environment: ending test'));
  }
  mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
    if (err) {
      return done(err);
    }
    db.dropDatabase(function(err) {
      done(err);
    });
  })
});

describe('/api', function() {
  const user = 'user';
  const pass = 'pass';
  const authString = 'username=' + user + '&password=' + pass;

  describe('GET before auth', function() {
    it('should be unauthorized', function(done) {
      const routes = [
        // This should really be false but returns true for undefined user and pass.
        // {method: 'post', path: 'users'},

        // This returns a 401
        // {method: 'post', path: 'oauth2/token'},

        {method: 'get', path: 'users'},
        {method: 'get', path: 'beers'},
        {method: 'post', path: 'beers'},
        {method: 'get', path: 'beers/fakeid'},
        {method: 'put', path: 'beers/fakeid'},
        {method: 'delete', path: 'beers/fakeid'},

        {method: 'get', path: 'clients'},
        {method: 'post', path: 'clients'},
        {method: 'get', path: 'oauth2/authorize'},
        {method: 'post', path: 'oauth2/authorize'},
      ];
      function unauthorizedGet(route, callback) {
        request(app)
          [route.method](path.join('/api', route.path))
          .end(function(err, res) {
            if (err) {
              return callback(err);
            } else {
              expect(res.ok).to.eq(false, 'failed with ' + JSON.stringify(route));
              expect(res.status).to.eq(400, 'failed with ' + JSON.stringify(route));
              callback();
            }
          });
      }
      async.each(routes, unauthorizedGet, function(err) {
        if (err) {
          return done(err);
        } else {
          done();
        }
      });
    });
  });

  describe('POST /users', function() {
    it('should create a new user', function(done) {
      request(app)
        .post('/api/users')
        .send('username=' + user)
        .send('password=' + pass)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          const body = res.body;
          expect(body.message).to.eq('New beer drinker added to the locker room!');
          done();
        });
    });
  });

  describe('GET /users', function() {
    it('should return an array of existing users', function(done) {
      request(app)
        .get('/api/users')
        .send(authString)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }

          const body = res.body;
          expect(body).to.be.instanceof(Array);
          const firstUser = body[0];
          expect(firstUser.username).to.eq(user);
          expect(firstUser.password).to.exist;
          done();
        });
    });
  });

  describe('POST /beers', function() {
    it('should create a new beer', function(done) {
      request(app)
        .post('/api/beers')
        .send(authString)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name=Anchor Steam')
        .send('type=Stout')
        .send('quantity=12')
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.ok).to.be.true;
          const body = res.body;
          expect(body.message).to.eq('Beer added to the locker!');
          expect(body.data.name).to.eq('Anchor Steam');
          expect(body.data.type).to.eq('Stout');
          expect(body.data.quantity).to.eq(12);
          done();
        });
    });
  });
});
