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
        'users',
        'clients',
        'beers',
        'oauth2/authorize'
      ];
      function unauthorizedGet(endpoint, callback) {
        request(app)
          .get(path.join('/api', endpoint))
          .end(function(err, res) {
            if (err) {
              return callback(err);
            } else {
              expect(res.ok).to.be.false;
              expect(res.status).to.eq(400, 'failed with ' + endpoint);
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

  // describe('GET before auth', function() {
  //   describe('should be unauthorized', function() {
  //     it('/users', function(done) {
  //       request(app)
  //         .get('/api/users')
  //         .end(function(err, res) {
  //           if (err) {
  //             return done(err);
  //           }
  //           expect(res.ok).to.be.false;
  //           expect(res.status).to.eq(403);
  //           done();
  //         });
  //     });

  //     it('/clients', function(done) {
  //       request(app)
  //         .get('/api/clients')
  //         .end(function(err, res) {
  //           if (err) {
  //             return done(err);
  //           }
  //           expect(res.ok).to.be.false;
  //           expect(res.status).to.eq(403);
  //           done();
  //         });
  //     });

  //     it('/oauth2/authorize', function(done) {
  //       request(app)
  //         .get('/api/oauth2/authorize')
  //         .end(function(err, res) {
  //           if (err) {
  //             return done(err);
  //           }
  //           expect(res.ok).to.be.false;
  //           expect(res.status).to.eq(403);
  //           done();
  //         });
  //     });
  //   });
  // });
    

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

  describe('GET /users', function(done) {
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
});
