# xts-binary-marketdata-api

Welcome to the XTS-MarketData-API SDK, This repository is Official Node.js library for Symphony XTS-MarketData-API.

API Documentation for XTS-MarketData API can be found in the below link.

https://developers.symphonyfintech.in/doc/apimarketdata

The XTS market data API provides developer, data-scientist, financial analyst and investor the market data with very low latency.
It provides market data from various Indian electronic exchanges.

With the use of the socket.io library, the API has streaming capability and will push data notifications in a JSON format.

There is also an examples folder available which illustrates how to create a connection to XTS marketdata component in order to subscribe to real-time events.
Please request for apikeys with Symphony Fintech developer support team to start integrating your application with XTS OEMS.

## Installation

```bash
npm install xts-marketdata-api
```

## Usage

Access the interactive component of xts-marketdata-api like below.

```js
var XtsMarketDataAPI = require('xts-marketdata-api').XtsMarketDataAPI;
```

Creating the instance of xtsMarketDataAPI

```js
xtsMarketDataAPI = new XtsMarketDataAPI(
  'https://developers.symphonyfintech.in/apibinarymarketdata'
);
```

call the login API to generate the token

```js
var loginRequest = {
  secretKey: 'Drty585#w',
  appKey: 'c4e15efa9c97e489f80873',
};

let logIn = await xtsMarketDataAPI.logIn(loginRequest);
```

Once the token is generated you can call any api provided in the documentation. All API’s are easy to integrate and implemented with async-await mechanism.
Below is the sample Code snippet which calls the client config API.

```js
let response = await xtsMarketDataAPI.clientConfig();

console.log(response);
```

## Instantiating the XtsMarketDataWS

This component provides functionality to access the socket related events. All real-time events can be registered via XtsMarketDataWS .
After token is generated, you can access the socket component and instantiate the socket Instance and call the init method of the socket like below

```js
var XtsMarketDataWS = require('xts-marketdata-api').WS;
xtsMarketDataWS = new XtsMarketDataWS('https://developers.symphonyfintech.in/apibinarymarketdata');
var socketInitRequest = {
  userID: 'XYZ',
  publishFormat: 'JSON',
  broadcastMode: 'Full',
  token: logIn.result.token, // Token Generated after successful LogIn
};
xtsMarketDataWS.init(socketInitRequest);
```

You can now register events to listen to the real time market data events and will be receiving the json objects in the response.

```js
var registerEvents = async function () {
  //instantiating the listeners for all event related data

  //"connect" event listener
  xtsMarketDataWS.onConnect((connectData) => {
    console.log(connectData);
  });

  //"joined" event listener
  xtsMarketDataWS.onJoined((joinedData) => {
    console.log(joinedData);
  });

  //"error" event listener
  xtsMarketDataWS.onError((errorData) => {
    console.log(errorData);
  });

  //xts-binary-event listner
  xtsMarketDataWS.onXTSBinaryPacketEvent((data) => {
    console.log(data);
  });

  //"disconnect" event listener
  xtsMarketDataWS.onDisconnect((disconnectData) => {
    console.log(disconnectData);
  });

  //"candleDataEvent" event listener
  xtsMarketDataWS.onCandleDataEvent((candleData) => {
    console.log(candleData);
  });

  // //"logout" event listener
  xtsMarketDataWS.onLogout((logoutData) => {
    console.log(logoutData);
  });
};

```

## Detailed explanation of API

Below is the brief information related to api’s provided by XTS-marketdata-API SDK.

## instruments API

## subscription

Calls POST /instruments/subscription.

```js
let response = await xtsMarketDataAPI.subscription({
    instruments: [
      {
        exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
        exchangeInstrumentID: 22,
      },
      {
        exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
        exchangeInstrumentID: 11536,
      },
    ],
    xtsMessageCode: 1502,
  };
```

## unSubscription

Calls PUT /instruments/subscription.

```js
let response = await xtsMarketDataAPI.unSubscription({
  instruments: [
    {
      exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
      exchangeInstrumentID: 2885,
    },
    {
      exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
      exchangeInstrumentID: 11536,
    },
  ],
  xtsMessageCode: 1502,
});
```

## quotes

Calls POST /instruments/quotes.

```js
let response = await xtsMarketDataAPI.getQuotes({
  isTradeSymbol: isTradeSymbol,
  instruments: [
    {
      exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
      exchangeInstrumentID: 2885,
    },
    {
      exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
      exchangeInstrumentID: 11536,
    },
  ],
  xtsMessageCode: 1502,
  publishFormat: 'JSON',
});
```

## clientConfig

Calls POST /config/clientConfig.

```js
let response = await xtsMarketDataAPI.clientConfig();
```

## search API

## searchInstrumentsById

Calls POST /search/instrumentsbyid.

```js
let response = await xtsMarketDataAPI.searchInstrumentsById({
  source: 'WEBAPI',
  isTradeSymbol: false,
  instruments: [
    {
      exchangeSegment: xtsMarketDataAPI.exchangeSegments.NSECM,
      exchangeInstrumentID: '3045',
    },
  ],
});
```

## searchInstruments

Calls POST /search/instruments.

```js
let response = await xtsMarketDataAPI.searchInstrument({
  searchString: 'REL',
  source: source,
});
```

We do have a trading API component which will provide the trading capability of our application. For more info please check the following link.

https://symphonyfintech.com/xts-trading-front-end-api/
