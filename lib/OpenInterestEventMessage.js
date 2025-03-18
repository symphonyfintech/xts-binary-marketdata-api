const MarketDataEventMessage = require("./MarketDataEventMessage");

class OpenInterestEventMessage extends MarketDataEventMessage {
    constructor(
        messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID,
        exchangeTimeStamp, xtsMarketType, openInterest, underlyingInstrumentID, underlyingExchangeSegment,
        underlyingIDIndexName, underlyingTotalOpenInterest
    ) {
        super(messageCode, messageVersion, applicationType, tokenID, exchangeSegment, exchangeInstrumentID, exchangeTimeStamp);
        this.XTSMarketType = xtsMarketType;
        this.OpenInterest = openInterest;
        this.UnderlyingInstrumentID = underlyingInstrumentID;
        this.UnderlyingExchangeSegment = underlyingExchangeSegment;
        this.UnderlyingIDIndexName = underlyingIDIndexName;
        this.UnderlyingTotalOpenInterest = underlyingTotalOpenInterest;
    }

    deserialize(binaryData, count) {
        count = super.deserialize(binaryData, count);

        this.XTSMarketType = binaryData.getInt16(count,true);
        count += 2;

        this.OpenInterest = binaryData.getInt32(count,true);
        count += 4;

        this.UnderlyingExchangeSegment = binaryData.getInt16(count,true);
        count += 2;

        this.UnderlyingInstrumentID = binaryData.getBigUint64(count,true);
        count += 8;

        const isStringExists = binaryData.getInt8(count,true) === 1;
        count++;

        if (isStringExists) {
            const stringLength = binaryData.getInt8(count,true);
            count++;

            // const arrayBuffer = binaryData.subarray(count, count + stringLength);
            // this.UnderlyingIDIndexName = new TextDecoder().decode(arrayBuffer).toUpperCase();
            const arrayBuffer = new Uint8Array(binaryData.buffer, binaryData.byteOffset + count, stringLength);
            this.UnderlyingIDIndexName = new TextDecoder().decode(arrayBuffer).toUpperCase();
            count += stringLength;
        }

        this.UnderlyingTotalOpenInterest = binaryData.getInt32(count,true);
        count += 4;

        return count;
    }
}

module.exports = OpenInterestEventMessage;