class MarketDepth {
    constructor(size, price, totalOrders, buyBackMarketMaker) {
        this.Size = size;
        this.Price = price;
        this.TotalOrders = totalOrders;
        this.BuyBackMarketMaker = buyBackMarketMaker;
    }

    deserialize(binaryData, count) {
        this.Size = binaryData.getInt32(count,true);
        count += 4;

        this.Price = binaryData.getFloat64(count,true);
        count += 8;

        this.TotalOrders = binaryData.getInt32(count,true);
        count += 4;

        this.BuyBackMarketMaker = binaryData.getUint16(count,true);
        count += 2;

        return count;
    }
}

module.exports = MarketDepth;
