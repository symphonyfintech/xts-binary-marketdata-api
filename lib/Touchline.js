const MarketDepth = require("./MarketDepth");

class Touchline {
    constructor(
        bid, ask, lastTradedPrice, lastTradedQuantity, totalBuyQuantity, totalSellQuantity,
        totalTradedQuantity, averageTradedPrice, lastTradedTime, lastUpdateTime, percentChange,
        open, high, low, close, totalValueTraded, buyBackTotalBuy, buyBackTotalSell
    ) {
        this.BidInfo = bid;
        this.AskInfo = ask;
        this.LastTradedPrice = lastTradedPrice;
        this.LastTradedQuantity = lastTradedQuantity;
        this.TotalBuyQuantity = totalBuyQuantity;
        this.TotalSellQuantity = totalSellQuantity;
        this.TotalTradedQuantity = totalTradedQuantity;
        this.AverageTradedPrice = averageTradedPrice;
        this.LastTradedTime = lastTradedTime;
        this.LastUpdateTime = lastUpdateTime;
        this.PercentChange = percentChange;
        this.Open = open;
        this.High = high;
        this.Low = low;
        this.Close = close;
        this.TotalValueTraded = totalValueTraded;
        this.BuyBackTotalBuy = buyBackTotalBuy;
        this.BuyBackTotalSell = buyBackTotalSell;
    }

    deserialize(binaryData, count) {
        this.BidInfo = new MarketDepth(0, 0, 0, 0);
        count = this.BidInfo.deserialize(binaryData, count);

        this.AskInfo = new MarketDepth(0, 0, 0, 0);
        count = this.AskInfo.deserialize(binaryData, count);

        this.LastUpdateTime = binaryData.getBigUint64(count,true);
        count += 8;

        this.LastTradedPrice = binaryData.getFloat64(count,true);
        count += 8;

        this.LastTradedQuantity = binaryData.getInt32(count,true);
        count += 4;

        this.TotalBuyQuantity = binaryData.getUint32(count,true);
        count += 4;

        this.TotalSellQuantity = binaryData.getUint32(count,true);
        count += 4;

        this.TotalTradedQuantity = binaryData.getUint32(count,true);
        count += 4;

        this.AverageTradedPrice = binaryData.getFloat64(count,true);
        count += 8;

        this.LastTradedTime = binaryData.getBigUint64(count,true);
        count += 8;

        this.PercentChange = binaryData.getFloat64(count,true);
        count += 8;

        this.Open = binaryData.getFloat64(count,true);
        count += 8;

        this.High = binaryData.getFloat64(count,true);
        count += 8;

        this.Low = binaryData.getFloat64(count,true);
        count += 8;

        this.Close = binaryData.getFloat64(count,true);
        count += 8;

        // console.log("Reading TotalValueTraded at count:", count);
        // console.log("Raw bytes:", binaryData.buffer.slice(count, count + 8));
        // console.log("Raw bytes:", new Uint8Array(binaryData.buffer, count, 8));

        if (count + 8 > binaryData.byteLength) {
            // console.error("Buffer overflow while reading TotalValueTraded");
            return count;
        }
        

        this.TotalValueTraded = binaryData.getFloat64(count, true);
        // console.log("Deserialized TotalValueTraded:", this.TotalValueTraded);
        if (isNaN(this.TotalValueTraded)) {
            // console.warn("Received NaN for TotalValueTraded, setting to 0.");
            this.TotalValueTraded = 0;  // Or any default value you prefer
        }
        count += 8;

        // this.TotalValueTraded = binaryData.getFloat64(count,true);
        // count += 8;

        this.BuyBackTotalBuy = binaryData.getUint16(count,true);
        count += 2;

        this.BuyBackTotalSell = binaryData.getUint16(count,true);
        count += 2;

        return count;


          
    }

    static empty() {
        return new Touchline(
            new MarketDepth(0, 0, 0, 0),
            new MarketDepth(0, 0, 0, 0),
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        );
    }
}

module.exports = Touchline;