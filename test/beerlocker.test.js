'use strict';

const request = require('supertest');
const expect = require('chai').expect;
const path = require('path');
const url = require('url');
const mongodb = require('mongodb');
const async = require('async');
const cheerio = require('cheerio');

const app = require('../server');
const agent = request.agent(app);
var port;

before(function(done) {
  if (!process.env.MONGODB_URI.includes('test')) {
    return done(new Error('Wrong environment: ending test'));
  }

  // Use a fresh database on each test run.
  mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
    if (err) {
      return done(err);
    }
    db.dropDatabase(function(err) {
      emitDone(err);
    });
  });

  // Get the port of the superagent.
  agent
    .post('/api/users')
    .end(function(err, res) {
      try {
        port = res.request.url.split(':')[2].split('/')[0];
      } catch (e) {
        err = err || e;
      }
      emitDone(err);
    });

  // Wait for both async ops to be done.
  var check = 0;
  var err = [];
  function emitDone(e) {
    check++;
    if (e) {
      err.push(e);
    }
    if (check > 1) {
      done( (err.length > 0) ? err : null );
    }
  }
});


describe('/api', function() {
  const user = 'user';
  const pass = 'pass';
  const authString = 'username=' + user + '&password=' + pass;
  const clientName = 'test_client';
  const clientId = 'test_id';
  const clientSecret = 'test_secret';
  const responseType = 'code';
  var transactionId;
  var authCode;
  var accessToken;

  // Problematic unauthenticated requests:
  // This should really be false but returns true for undefined user and pass.
  // {method: 'post', path: 'users'},
  // This returns a 401
  // {method: 'post', path: 'oauth2/token'},

  describe('requests before auth', function() {
    it('should be unauthorized', function(done) {
      const routes = [
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
        agent
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
      agent
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
      agent
        .get('/api/users')
        .query(authString)
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
      agent
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

  describe('POST /clients', function() {
    it('should create a new client', function(done) {
      agent
        .post('/api/clients')
        .send(authString)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('id=' + clientId)
        .send('secret=' + clientSecret)
        .send('name=' + clientName)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.ok).to.be.true;
          expect(res.body).to.exist;
          done();
        })
    })
  })

  describe('GET /clients', function() {
    it('should return the new client', function(done) {
      agent
        .get('/api/clients')
        .query(authString)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.ok).to.be.true;
          expect(res.body).to.be.instanceof(Array);
          expect(res.body[0].id).to.exist;
          done();
        })
    })
  })

  describe('GET /oauth2/authorize', function() {
    it('should give the choice to Allow or Deny client', function(done) {
      var params = parameterize({
        'client_id': clientId,
        'username': user,
        'password': pass,
        'response_type': responseType,
        'redirect_uri': 'http://localhost:' + port,
      });
      // save transaction id
      agent
        .get('/api/oauth2/authorize')
        .query(params)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.ok).to.be.true;
          var $ = cheerio.load(res.text);
          transactionId = $('input[name=transaction_id]').attr('value');
          expect(transactionId).to.exist;
          done();
        });
    });
  });

  describe('POST /oauth2/authorize', function() {
    it('should get an authorization code', function(done) {
      agent
        .post('/api/oauth2/authorize')
        .send(authString)
        .send('transaction_id=' + transactionId)
        .send('submit=Allow')
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          const data = url.parse(res.header.location, true);
          authCode = data.query.code;
          expect(authCode).to.exist;
          done();
        })
    })
  })

  describe('POST /oauth2/token', function() {
    it('should exchange a code for a token', function(done) {
      const clientAuthString = parameterize({
        username: clientId,
        password: clientSecret
      });
      agent
        .post('/api/oauth2/token')
        .send(parameterize({
          'grant_type': 'authorization_code',
          'code': authCode,
          'redirect_uri': 'http://localhost:' + port
        }))
        .auth(clientId, clientSecret)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          accessToken = res.body.access_token.value;
          expect(accessToken).to.exist;
          done();
        })
    })
  })

  describe('GET /beers', function() {
    it('should be authorized with a token', function(done) {
      agent
        .get('/api/beers')
        .set('Authorization', 'Bearer ' + accessToken)
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          expect(res.body).to.be.instanceof(Array);
          expect(res.body[0].name).to.exist;
          done();
        })
    })
  })

  describe('requests with a token', function() {
    it('should be authorized', function(done) {
      const routes = [
        {method: 'get', path: 'users'},
        {method: 'get', path: 'beers'},
        {method: 'post', path: 'beers'},
        {method: 'get', path: 'beers/fakeid'},
        {method: 'put', path: 'beers/fakeid'},
        {method: 'delete', path: 'beers/fakeid'},
        {method: 'get', path: 'clients'},
        {method: 'post', path: 'clients'},
      ];
      function requestWithToken(route, callback) {
        agent
          [route.method](path.join('/api', route.path))
          .set('Authorization', 'Bearer ' + accessToken)
          .end(function(err, res) {
            if (err) {
              return callback(err);
            } else {
              expect(res.unauthorized).to.be.false;
              callback();
            }
          });
      }
      async.each(routes, requestWithToken, function(err) {
        if (err) {
          return done(err);
        } else {
          done();
        }
      });
    });
  });

});

function parameterize(params) {
  return Object.keys(params).map(function(key) {
    return key + '=' + params[key];
  }).join('&');
}