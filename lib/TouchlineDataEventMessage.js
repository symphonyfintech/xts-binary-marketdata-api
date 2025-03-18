const MarketDataEventMessage = require("./MarketDataEventMessage");
const Touchline = require("./Touchline");

class TouchlineEventMessage extends MarketDataEventMessage {
    constructor(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp, touchline, bookType, marketType) {
        super(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp);
        this.Touchline = touchline;
        this.BookType = bookType;
        this.XMarketType = marketType;
    }

    deserialize(binaryData, count) {
        count = super.deserialize(binaryData, count);
        this.Touchline = new Touchline();
        count = this.Touchline.deserialize(binaryData, count);
        this.BookType = binaryData.getInt16(count,true);
        count += 2;
        this.XMarketType = binaryData.getInt16(count,true);
        count += 2;
        return count;
    }
}

module.exports = TouchlineEventMessage;