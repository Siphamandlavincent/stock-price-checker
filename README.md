# Stock Price Checker

A full-stack JavaScript application that allows users to:
- Get stock prices for one or two stocks
- Like stocks and track the number of likes
- Compare relative likes between two stocks

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example`
4. Run the server: `npm start`
5. Run tests: `npm test`

## API Endpoints
- GET `/api/stock-prices?stock=STOCK` - Get single stock data
- GET `/api/stock-prices?stock=STOCK&like=true` - Get stock data and like it
- GET `/api/stock-prices?stock=STOCK1&stock=STOCK2` - Compare two stocks
- GET `/api/stock-prices?stock=STOCK1&stock=STOCK2&like=true` - Compare and like both stocks
