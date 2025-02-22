'use strict';
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// Connect to MongoDB
const connectionString = "mongodb+srv://PITSISIYANDA:G2kDLo7xcQ9EJlQN@cluster0.ljyvj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Create Stock Schema
const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  likes: { type: Number, default: 0 },
  ips: [String]
});

const Stock = mongoose.model('Stock', StockSchema);

// Function to fetch stock price
async function getStockPrice(symbol) {
  try {
    const response = await fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`);
    const data = await response.json();
    return data.latestPrice;
  } catch (error) {
    return null;
  }
}

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { stock, like } = req.query;
      const clientIp = req.ip;

      try {
        if (Array.isArray(stock)) {
          // Handle comparison of two stocks
          const stocks = await Promise.all(stock.map(async (symbol) => {
            const price = await getStockPrice(symbol);
            let stockDoc = await Stock.findOne({ symbol: symbol.toUpperCase() });
            
            if (!stockDoc) {
              stockDoc = new Stock({ symbol: symbol.toUpperCase() });
            }

            if (like && !stockDoc.ips.includes(clientIp)) {
              stockDoc.likes++;
              stockDoc.ips.push(clientIp);
              await stockDoc.save();
            }

            return { symbol: symbol.toUpperCase(), price, likes: stockDoc.likes };
          }));

          const rel_likes = stocks[0].likes - stocks[1].likes;

          return res.json({
            stockData: [
              { stock: stocks[0].symbol, price: stocks[0].price, rel_likes },
              { stock: stocks[1].symbol, price: stocks[1].price, rel_likes: -rel_likes }
            ]
          });
        } else {
          // Handle single stock
          const price = await getStockPrice(stock);
          let stockDoc = await Stock.findOne({ symbol: stock.toUpperCase() });

          if (!stockDoc) {
            stockDoc = new Stock({ symbol: stock.toUpperCase() });
          }

          if (like && !stockDoc.ips.includes(clientIp)) {
            stockDoc.likes++;
            stockDoc.ips.push(clientIp);
            await stockDoc.save();
          }

          return res.json({
            stockData: {
              stock: stock.toUpperCase(),
              price,
              likes: stockDoc.likes
            }
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'server error' });
      }
    });
};
