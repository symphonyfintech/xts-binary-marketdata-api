const DataMessage = require("./DataMessage");

class MarketDataEventMessage extends DataMessage {
    constructor(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp) {
        super(messageCode, messageVersion, applicationType, tokenID);
        this.ExchangeSegment = exchangeSegment;
        this.ExchangeInstrumentID = exchangeInstrumentID;
        this.ExchangeTimeStamp = exchangeTimeStamp;
    }

    deserialize(binaryData, count) {
        count = super.deserialize(binaryData, count);
        
        this.ExchangeSegment = binaryData.getUint16(count,true);
        count += 2;

        this.ExchangeInstrumentID = binaryData.getInt32(count,true);
        count += 4;

        this.ExchangeTimeStamp = binaryData.getBigUint64(count,true);
        count += 8;

        return count;
    }
}

module.exports = MarketDataEventMessage;