var merge = require('deepmerge');
var list = {};

module.exports.loadInMemory = async function (messageCode, exchangeSegment, exchangeInstrumentID, marketData) {
    list[messageCode + '|' + exchangeSegment + '|' + exchangeInstrumentID] = marketData;
    return marketData;
}

module.exports.getFromInMemory = function (messageCode, exchangeSegment, exchangeInstrumentID) {
    return list[messageCode + '|' + exchangeSegment + '|' + exchangeInstrumentID];
}
