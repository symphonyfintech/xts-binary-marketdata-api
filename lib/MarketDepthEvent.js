const MarketDataEventMessage = require("./MarketDataEventMessage");
const MarketDepth = require("./MarketDepth");
const Touchline = require("./Touchline");

class MarketDepthEventMessage extends MarketDataEventMessage {
    constructor(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp, bids = [], asks = [], touchline = new Touchline(), bookType, marketType) {
        super(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp);
        this.Bids = bids;
        this.Asks = asks;
        this.Touchline = touchline;
        this.BookType = bookType;
        this.XMarketType = marketType;
    }

    deserialize(binaryData, count) {
        count = super.deserialize(binaryData, count);
        
        const bidCount = binaryData.getInt32(count,true);
        count += 4;
        this.Bids = [];
        for (let i = 0; i < bidCount; i++) {
            let bidInfo = new MarketDepth(0, 0, 0, 0);
            count = bidInfo.deserialize(binaryData, count);
            this.Bids.push(bidInfo);
        }

        const askCount = binaryData.getInt32(count,true);
        count += 4;
        this.Asks = [];
        for (let i = 0; i < askCount; i++) {
            let askInfo = new MarketDepth(0, 0, 0, 0);
            count = askInfo.deserialize(binaryData, count);
            this.Asks.push(askInfo);
        }

        this.Touchline = new Touchline();
        count = this.Touchline.deserialize(binaryData, count);
        
        this.BookType = binaryData.getInt16(count,true);
        count += 2;
        this.XMarketType = binaryData.getInt16(count,true);
        count += 2;
        
        return count;
    }
}

module.exports = MarketDepthEventMessage;
