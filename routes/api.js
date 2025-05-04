const express = require('express');
const router = express.Router();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Stock = require('../models/Stock');
const crypto = require('crypto');

// Helper function to anonymize IP
const anonymizeIp = (ip) => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};

// Helper function to fetch stock price
const getStockPrice = async (symbol) => {
  try {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.latestPrice;
  } catch (error) {
    console.error('Stock API Error:', error);
    throw new Error('Error fetching stock price');
  }
};

router.get('/stock-prices', async (req, res) => {
  try {
    const { stock, like } = req.query;
    const clientIp = anonymizeIp(req.ip || req.connection.remoteAddress);

    if (!stock) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // Handle single stock request
    if (!Array.isArray(stock)) {
      try {
        const stockPrice = await getStockPrice(stock);
        let stockDoc = await Stock.findOne({ symbol: stock.toUpperCase() });

        if (!stockDoc) {
          stockDoc = new Stock({ symbol: stock.toUpperCase() });
        }

        if (like === 'true' && !stockDoc.ips.includes(clientIp)) {
          stockDoc.likes += 1;
          stockDoc.ips.push(clientIp);
          await stockDoc.save();
        }

        return res.json({
          stockData: {
            stock: stockDoc.symbol,
            price: stockPrice,
            likes: stockDoc.likes
          }
        });
      } catch (error) {
        console.error('Single stock error:', error);
        return res.status(500).json({ error: 'Error processing single stock request' });
      }
    }

    // Handle two stocks comparison
    try {
      const stocks = Array.isArray(stock) ? stock : [stock];
      const stockData = await Promise.all(stocks.map(async (symbol) => {
        const price = await getStockPrice(symbol);
        let stockDoc = await Stock.findOne({ symbol: symbol.toUpperCase() });

        if (!stockDoc) {
          stockDoc = new Stock({ symbol: symbol.toUpperCase() });
        }

        if (like === 'true' && !stockDoc.ips.includes(clientIp)) {
          stockDoc.likes += 1;
          stockDoc.ips.push(clientIp);
          await stockDoc.save();
        }

        return {
          stock: stockDoc.symbol,
          price: price,
          likes: stockDoc.likes
        };
      }));

      // Calculate relative likes
      const rel_likes = stockData[0].likes - stockData[1].likes;
      stockData[0].rel_likes = rel_likes;
      stockData[1].rel_likes = -rel_likes;

      delete stockData[0].likes;
      delete stockData[1].likes;

      return res.json({ stockData });
    } catch (error) {
      console.error('Multiple stocks error:', error);
      return res.status(500).json({ error: 'Error processing multiple stocks request' });
    }
  } catch (error) {
    console.error('Route error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
