const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
  suite('GET /api/stock-prices => stockData object', function () {
    test('1 stock', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          done();
        });
    });

    test('1 stock with like', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'likes');
          assert.isAbove(res.body.stockData.likes, 0);
          done();
        });
    });

    test('2 stocks', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'] })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'stockData');
          assert.property(res.body[1], 'stockData');
          assert.property(res.body[0].stockData, 'rel_likes');
          assert.property(res.body[1].stockData, 'rel_likes');
          done();
        });
    });

    test('2 stocks with like', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'msft'], like: true })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], 'stockData');
          assert.property(res.body[1], 'stockData');
          assert.property(res.body[0].stockData, 'rel_likes');
          assert.property(res.body[1].stockData, 'rel_likes');
          done();
        });
    });
  });
});
