var settings = require('./config/app/settings.json');
var events = require('events');
var inMemoryStore = require('./inMemoryStore');
var linq = require("linq");
var socketIoClient = require("socket.io-client");
var logger = require('./logger');
var config = require('./config/app/config.json');
var merge = require('deepmerge');
var pako = require('pako');
const OpenInterestEventMessage = require("./OpenInterestEventMessage");
const MarketDepthEventMessage = require("./MarketDepthEvent");
const TouchlineEventMessage = require("./TouchlineDataEventMessage");

function handleMessage(messageCode, dataView, count) {
    let parsedObject = null;
    switch (messageCode) {
        case settings.enums.marketDataPorts.openInterestEvent: 
            {
                const openInterestEvent = new OpenInterestEventMessage();
                count = openInterestEvent.deserialize(dataView, count);
                parsedObject = openInterestEvent;
            }
            break;

        case settings.enums.marketDataPorts.marketDepthEvent: 
            {
                const marketDepthEvent = new MarketDepthEventMessage();
                count = marketDepthEvent.deserialize(dataView, count);
                parsedObject = marketDepthEvent;
            }
            break;

        case settings.enums.marketDataPorts.touchlineEvent: 
            {
                const touchlineEvent = new TouchlineEventMessage();
                count = touchlineEvent.deserialize(dataView, count);
                parsedObject = touchlineEvent;
            }
            break;

        default:
            console.warn("Unknown message code:", messageCode);
            break;
    }
    return parsedObject;
}

module.exports = class MDEmitter {

    /**
     * Constructs an XTSEmitter instance to enable data transfer via socket related events.
     *  
     * @constructor
     *
     * @param {String} url
     *   url parameter is used to connect to the particular server.
     * 
     */
    // constructor(url) {

    //     this.url = url == "undefined" ? config.url : url;
    //     this.socketMD = {
    //         isConnected: false,
    //         socketMarketData: null,
    //         interval: null,
    //     }
    //     this.eventEmitter = new events.EventEmitter();

    // }


      constructor(url) {
        this.url = url === undefined ? config.url : url;
        let arr = this.url.split("/");
        this.url = arr[0] + '/' + arr[1] + '/' + arr[2];
        this.path = '/';
        for (let i = 3; i < arr.length; i++) {
          if (i === 3) {
            this.path = this.path + arr[i];
          }
          else {
            this.path = this.path + '/' + arr[i];
          }
        }
        this.path = this.path + '/' + 'socket.io';
        this.socketMD = {
          isConnected: false,
          socketMarketData: null,
          interval: null,
        };
        this.eventEmitter = new events.EventEmitter();
      }

    /**
     * set the token value by providing the token in the input
     *
     * @param {string} token
     *  token parameter will be generated after successful login and will be used in other private API's
     *
     */
    set token(token) {
        this._token = token;
    }

    /**
     * Returns the token generated after successful logIn
     *
     *
     * @return
     *   the value of token generated after successful logIn
     */
    get token() {
        return this._token;
    }


    /**
     * set the userID value by providing the userID in the input
     *
     * @param {string} userID
     *  userID for the particular user
     */
    set userID(userID) {
        this._userID = userID;
    }

    /**
     * Returns userID for the particular user
     *
     *
     * @return
     *   the userID for the particular user
     */
    get userID() {
        return this._userID;
    }

    /**
     * set the publishFormat(JSON|Binary) required for the user
     *
     * @param {string} publishFormat
     *  publishFormat (JSON|Binary) required for the user
     */
    set publishFormat(publishFormat) {
        this._publishFormat = publishFormat;
    }

    /**
     * Returns publishFormat(JSON|Binary) required for the user
     *
     *
     * @return
     *   the publishFormat(JSON|Binary) required for the user
     */
    get publishFormat() {
        return this._publishFormat;
    }

    /**
     * set the broadcastMode (Full|partial) required for the user
     *
     * @param {string} broadcastMode
     *  broadcastMode (Full|partial) required for the user
     */
    set broadcastMode(broadcastMode) {
        this._broadcastMode = broadcastMode;
    }

    /**
     * Returns broadcastMode (Full|partial) required for the user
     *
     *
     * @return
     *   the broadcastMode (Full|partial) required for the user
     */
    get broadcastMode() {
        return this._broadcastMode;
    }

    /**
     * set the url value by providing the url in the input
     *
     * @param {string} url
     *  url parameter is used to connect to the particular server.
     */
    set url(url) {
        this._url = url;
    }


    /**
     * Returns url used to connect to the particular server.
     *
     *
     * @return
     *   the url used to connect to the particular server.
     */
    get url() {
        return this._url;
    }

    /**
     * Initalizes the socket by accepting userID and token as input parameters
     *
     * @param {Object} reqObject request object.
     * 
     * @param {string} reqObject.userID
     *  userID for the particular user.
     * 
     * @param {string} reqObject.token
     *  token parameter will be generated after successful login and will be used in other private API's
     * 
     *  @param {string} reqObject.publishFormat
     *  publishFormat(JSON|Binary) required for the user
     * 
     *   @param {string} reqObject.broadcastMode
     *  broadcastMode (Full|partial) required for the user
     * 
     */
    init(reqObject) {

        this.userID = reqObject.userID;
        this.token = reqObject.token;
        this.publishFormat = reqObject.publishFormat;
        this.broadcastMode = reqObject.broadcastMode;

        if (this.socketMD.socketMarketData) {
            this.socketMD.socketMarketData.destroy();
            delete this.socketMD.socketMarketData;
            this.socketMD.socketMarketData = null;
        }
        // path: "/interactive/socket.io",
        
        this.socketMD.socketMarketData = socketIoClient(
            this.url, 
            { 
            // path: `/${config.endpoints.apiBinaryMarketData}`+"/socket.io",
            path: this.path,
            reconnection: false, 
            query: 
            { 
                token: this.token, 
                userID: this.userID, 
                publishFormat: this.publishFormat, 
                broadcastMode: this.broadcastMode 
            }, 
        });
        
        logger.logFile("socket is initialized with the following parameters url " + this.url + " token " + this.token + " userID " + this.userID);

        /**
         * Listener of the connect event via socket and emit the connect event via event Emitter
         *
         *
         * @event connect
         */
        this.socketMD.socketMarketData.on(settings.socket.connect, (data) => {
            this.socketMD.isConnected = true;
            console.info("socket connected successfully");
            this.eventEmitter.emit(settings.socket.connect, data);
        });


        /**
         * Listener of the joined event via socket and emit the joined event via event Emitter
         *
         *
         * @event joined
         */
        this.socketMD.socketMarketData.on(settings.socket.joined, (data) => {
            console.info("socket joined successfully");
            this.eventEmitter.emit(settings.socket.joined, data);
        });

        /**
         * Listener of the error event via socket and emit the error event via event Emitter
         *
         *
         * @event error
         */
        this.socketMD.socketMarketData.on(settings.socket.error, (data) => {
            console.info("socket error occurred");
            this.eventEmitter.emit(settings.socket.error, data);
        });


        /**
         * Listener of the disconnect event via socket and emit the disconnect event via event Emitter
         *
         *
         * @event disconnect
         */
        this.socketMD.socketMarketData.on(settings.socket.disconnect, (data) => {

            console.info("socket got disconnected");

            this.socketMD.isConnected = false;
            this.socketMD.interval = setInterval(() => {
                if (this.socketMD.isConnected) {
                    clearInterval(this.socketMD.interval);
                    this.socketMD.interval = null;
                    return;
                }
                let reqObject = {
                    userID: this.userID,
                    token: this.token,
                    publishFormat: this.publishFormat,
                    broadcastMode: this.broadcastMode
                }
                this.init(reqObject);
            }, 5000);

            this.eventEmitter.emit(settings.socket.disconnect, data);

        });

        /**
         * Listener of the 1502-binary-full event via socket and emit the marketDepthEvent via event Emitter
         *
         *
         * @event 1502-binary-full
         */
        this.socketMD.socketMarketData.on("1502-binary-full", (data) => {
            this.eventEmitter.emit(settings.socket.marketDepthEvent, data);
        });

        /**
         * Listener of the 1502-json-full event via socket and emit the marketDepthEvent via event Emitter
         *
         *
         * @event 1502-json-full
         */
        this.socketMD.socketMarketData.on("1502-json-full", async (data) => {
            let marketDataObject = await this.constructFullMarketDepthObject(settings.enums.marketDataPorts.marketDepthEvent, data);
            this.eventEmitter.emit(settings.socket.marketDepthEvent, marketDataObject);
        });

        /**
         * Listener of the 1502-json-partial event via socket and emit the marketDepthEvent via event Emitter
         *
         *
         * @event 1502-json-partial
         */
        this.socketMD.socketMarketData.on("1502-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialMarketDepthObject(settings.enums.marketDataPorts.marketDepthEvent, data);
            this.eventEmitter.emit(settings.socket.marketDepthEvent, marketDataObject);
        });


        /**
         * Listener of the 1504-binary-full event via socket and emit the indexDataEvent via event Emitter
         *
         *
         * @event 1504-binary-full
         */
        this.socketMD.socketMarketData.on("1504-binary-full", (data) => {
            this.eventEmitter.emit(settings.socket.indexDataEvent, data);
        });


        /**
         * Listener of the 1504-json-full event via socket and emit the indexDataEvent via event Emitter
         *
         *
         * @event 1504-json-full
         */
        this.socketMD.socketMarketData.on("1504-json-full", async (data) => {
            let marketDataObject = await this.constructFullIndexDataObject(settings.enums.marketDataPorts.indexDataEvent, data);
            this.eventEmitter.emit(settings.socket.indexDataEvent, marketDataObject);
        });


        /**
         * Listener of the 1504-json-partial event via socket and emit the indexDataEvent via event Emitter
         *
         *
         * @event 1504-json-partial
         */
        this.socketMD.socketMarketData.on("1504-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialIndexDataObject(settings.enums.marketDataPorts.indexDataEvent, data);
            this.eventEmitter.emit(settings.socket.indexDataEvent, marketDataObject);
        });


        /**
         * Listener of the 1510-binary-full event via socket and emit the openInterestEvent via event Emitter
         *
         *
         * @event 1510-binary-full
         */
        this.socketMD.socketMarketData.on("1510-binary-full", (data) => {
            this.eventEmitter.emit(settings.socket.openInterestEvent, data);
        });


        /**
         * Listener of the 1510-json-full event via socket and emit the openInterestEvent via event Emitter
         *
         *
         * @event 1510-json-full
         */
        this.socketMD.socketMarketData.on("1510-json-full", async (data) => {
            let marketDataObject = await this.constructFullOpenIntrestObject(settings.enums.marketDataPorts.openInterestEvent, data);
            this.eventEmitter.emit(settings.socket.openInterestEvent, marketDataObject);
        });



        /**
         * Listener of the 1510-json-partial event via socket and emit the openInterestEvent via event Emitter
         *
         *
         * @event 1510-json-partial
         */
        this.socketMD.socketMarketData.on("1510-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialOpenIntrestObject(settings.enums.marketDataPorts.openInterestEvent, data);
            this.eventEmitter.emit(settings.socket.openInterestEvent, marketDataObject);
        });

        /**
         * Listener of the 5018-binary-full event via socket and emit the marketDepth100Event via event Emitter
         *
         *
         * @event 5018-binary-full
         */
        this.socketMD.socketMarketData.on("5018-binary-full", (data) => {
            this.eventEmitter.emit(settings.socket.marketDepth100Event, data);
        });

        /**
         * Listener of the 5018-json-full event via socket and emit the marketDepth100Event via event Emitter
         *
         *
         * @event 5018-json-full
         */
        this.socketMD.socketMarketData.on("5018-json-full", async (data) => {
            let marketDataObject = await this.constructFullMarketDepth100Object(settings.enums.marketDataPorts.marketDepthEvent100, data);
            this.eventEmitter.emit(settings.socket.marketDepth100Event, marketDataObject);
        });

        /**
         * Listener of the 5018-json-partial event via socket and emit the marketDepth100Event via event Emitter
         *
         *
         * @event 5018-json-partial
         */
        this.socketMD.socketMarketData.on("5018-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialMarketDepth100Object(settings.enums.marketDataPorts.marketDepthEvent100, data);
            this.eventEmitter.emit(settings.socket.marketDepth100Event, marketDataObject);
        });

        /**
         * Listener of the 1505-binary-full event via socket and emit the candleDataEvent via event Emitter
         *
         *
         * @event 1505-binary-full
         */
        this.socketMD.socketMarketData.on("1505-binary-full", (data) => {
            this.eventEmitter.emit(settings.socket.candleDataEvent, data);
        });

        /**
         * Listener of the 1505-json-full event via socket and emit the candleDataEvent via event Emitter
         *
         *
         * @event 1505-json-full
         */
        this.socketMD.socketMarketData.on("1505-json-full", async (data) => {
            let marketDataObject = await this.constructFullCandleDataObject(settings.enums.marketDataPorts.candleDataEvent, data);
            this.eventEmitter.emit(settings.socket.candleDataEvent, marketDataObject);
        });

        /**
         * Listener of the 1505-json-partial event via socket and emit the candleDataEvent via event Emitter
         *
         *
         * @event 1505-json-partial
         */
        this.socketMD.socketMarketData.on("1505-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialCandleDataObject(settings.enums.marketDataPorts.candleDataEvent, data);
            this.eventEmitter.emit(settings.socket.candleDataEvent, marketDataObject);
        });

        /**
         * Listener of the 1105-json-partial event via socket and emit the instrumentPropertyChangeEvent via event Emitter
         *
         *
         * @event 1105-json-partial
         */
        this.socketMD.socketMarketData.on("1105-json-partial", async (data) => {
            let marketDataObject = await this.constructPartialOpenIntrestObject(settings.enums.marketDataPorts.instrumentPropertyChangeEvent, data);
            this.eventEmitter.emit(settings.socket.instrumentPropertyChangeEvent, marketDataObject);
        });

        /**
         * Listener of the xts-binary-packet event via socket and emit the instrumentPropertyChangeEvent via event Emitter
         *
         *
         * @event xts-binary-packet
         */

        this.socketMD.socketMarketData.on("xts-binary-packet", async (data) => {
            try {
                // const dataViewHeader = new DataView(data.buffer);
                const dataViewHeader = new DataView(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
                let offset = 0;
                let count = 0;
                let isNextPacket = true;
        
                while (isNextPacket && offset < data.byteLength) {
                    const isGzipCompressed = dataViewHeader.getInt8(offset, true);
                    offset++;
        
                    if (isGzipCompressed) {
                        // Extract compressed packet metadata
                        const messageCode = dataViewHeader.getUint16(offset, true);
                        offset += 2;
                        const exchangeSegment = dataViewHeader.getInt16(offset, true);
                        offset += 2;
                        const exchangeInstrumentId = dataViewHeader.getInt32(offset, true);
                        offset += 4;
                        const bookType = dataViewHeader.getInt16(offset, true);
                        offset += 2;
                        const marketType = dataViewHeader.getInt16(offset, true);
                        offset += 2;
                        const uncompressedPacketSize = dataViewHeader.getUint16(offset, true);
                        offset += 2;
                        const compressedPacketSize = dataViewHeader.getUint16(offset, true);
                        offset += 2;
        
                        // Decompress data using pako
                        // const compressedData = new Uint8Array(data.buffer, offset, compressedPacketSize);
                        if (compressedPacketSize <= 0 || offset + compressedPacketSize > data.byteLength) {
                            console.error("Invalid compressedPacketSize:", compressedPacketSize);
                            return;
                        }
                        const compressedData = data.subarray(offset, offset + compressedPacketSize);
                        const decompressedData = pako.inflateRaw(compressedData);
                        const dataView = new DataView(decompressedData.buffer);
                        let dataByteLength = decompressedData.byteLength;
                        let currentSize = compressedPacketSize + offset;
        
                        isNextPacket = currentSize < data.byteLength;
                        offset = isNextPacket ? currentSize : offset;
        
                        if (dataByteLength > 9 && isGzipCompressed) {
                            let parsedData = handleMessage(messageCode, dataView, count);
                            if (this.broadcastMode === "Full") {
                                if ( messageCode === 1501 ){
                                    let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.touchlineEvent, parsedData);
                                    // console.log("parsed data and ltp is: ", parsedData.ExchangeSegment , "Instrument id is: ", parsedData.ExchangeInstrumentID, "ltp is ", parsedData.Touchline.LastTradedPrice);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                                else if ( messageCode === 1502 ){
                                    let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.marketDepthEvent, parsedData);
                                    // console.log("parsed data and ltp is: ", parsedData.ExchangeSegment , "Instrument id is: ", parsedData.ExchangeInstrumentID, "ltp is ", parsedData.Touchline.LastTradedPrice);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                                else {
                                    let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.openInterestEvent, parsedData);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                            }
                            else {
                                if ( messageCode === 1501 ){
                                    let marketDataObject = await this.constructPartialTouchlineBinaryData(settings.enums.marketDataPorts.touchlineEvent, parsedData);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                                else if ( messageCode === 1502 ){
                                    let marketDataObject = await this.constructPartialMarketDepthObjectBinaryData(settings.enums.marketDataPorts.marketDepthEvent, parsedData);
                                    // console.log("parsed data and ltp is: ", parsedData.ExchangeSegment , "Instrument id is: ", parsedData.ExchangeInstrumentID, "ltp is ", parsedData.Touchline.LastTradedPrice);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                                else {
                                    let marketDataObject = await this.constructBinaryPartialOpenIntrestObject(settings.enums.marketDataPorts.openInterestEvent, parsedData);
                                    this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                                }
                            }
                        }
                    } else {
                        let dataByteLength = data.byteLength;
                        let dataView = dataViewHeader;
        
                        const messageCode = dataView.getUint16(offset, true);
                        offset += 2;
                        const exchangeSegment = dataView.getInt16(offset, true);
                        offset += 2;
                        const exchangeInstrumentId = dataView.getInt32(offset, true);
                        offset += 4;
                        const bookType = dataView.getInt16(offset, true);
                        offset += 2;
                        const marketType = dataView.getInt16(offset, true);
                        offset += 2;
                        const uncompressedPacketSize = dataView.getUint16(offset, true);
                        offset += 2;
                        count = offset;
        
                        let parsedData = handleMessage(messageCode, dataView, count);
        
                        isNextPacket = count < dataByteLength;
                        offset = isNextPacket ? offset + uncompressedPacketSize : 0;

                        if (this.broadcastMode === "Full") {
                            if ( messageCode === 1501 ){
                                let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.touchlineEvent, parsedData);
                                // console.log("parsed data and ltp is: ", parsedData.ExchangeSegment , "Instrument id is: ", parsedData.ExchangeInstrumentID, "ltp is ", parsedData.Touchline.LastTradedPrice);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                            else if ( messageCode === 1502 ){
                                let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.marketDepthEvent, parsedData);
                                // console.log("parsed data and ltp is: ", parsedData.ExchangeSegment , "Instrument id is: ", parsedData.ExchangeInstrumentID, "ltp is ", parsedData.Touchline.LastTradedPrice);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                            else {
                                let marketDataObject = await this.constructFullMarketDepthObjectBinaryData(settings.enums.marketDataPorts.openInterestEvent, parsedData);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                        }
                        else {
                            if ( messageCode === 1501 ){
                                let marketDataObject = await this.constructPartialTouchlineBinaryData(settings.enums.marketDataPorts.touchlineEvent, parsedData);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                            else if ( messageCode === 1502 ){
                                let marketDataObject = await this.constructPartialMarketDepthObjectBinaryData(settings.enums.marketDataPorts.marketDepthEvent, parsedData);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                            else {
                                let marketDataObject = await this.constructBinaryPartialOpenIntrestObject(settings.enums.marketDataPorts.openInterestEvent, parsedData);
                                this.eventEmitter.emit(settings.socket.xtsBinaryPacketEvent, marketDataObject);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error processing binary packet:", e);
            }        
    
        });

        /**
         * Listener of the logout event via socket and emit the logout event via event Emitter
         *
         *
         * @event logout
         */
        this.socketMD.socketMarketData.on(settings.socket.logout, (data) => {
            console.info("socket logout successfully");
            this.eventEmitter.emit(settings.socket.logout, data);
        });
    }

    /**
     * connect listener for event emitter
     * 
     */
    onConnect(fn) {

        this.eventEmitter.on(settings.socket.connect, (data) => {

            fn(data)
        });
    }

    /**
     * joined listener for event emitter
     * 
     */
    onJoined(fn) {

        this.eventEmitter.on(settings.socket.joined, (data) => {

            fn(data)
        });
    }

    /**
     * error listener for event emitter
     * 
     */
    onError(fn) {

        this.eventEmitter.on(settings.socket.error, (data) => {

            fn(data)
        });
    }

    /**
     * disconnect listener for event emitter
     * 
     */
    onDisconnect(fn) {

        this.eventEmitter.on(settings.socket.disconnect, (data) => {

            fn(data)
        });
    }


    /**
     * MarketDepthEvent listener for event emitter
     * 
     */
    onMarketDepthEvent(fn) {

        this.eventEmitter.on(settings.socket.marketDepthEvent, (data) => {

            fn(data);

        });
    }


    /**
     * OpenInterestEvent listener for event emitter
     * 
     */
    onOpenInterestEvent(fn) {

        this.eventEmitter.on(settings.socket.openInterestEvent, (data) => {

            fn(data);

        });
    }


    /**
     * indexDataEvent listener for event emitter
     * 
     */
    onIndexDataEvent(fn) {

        this.eventEmitter.on(settings.socket.indexDataEvent, (data) => {

            fn(data);

        });
    }

    /**
     * marketDepth100Event listener for event emitter
     * 
     */
    onMarketDepth100Event(fn) {

        this.eventEmitter.on(settings.socket.marketDepth100Event, (data) => {

            fn(data);

        });
    }

    /**
     * candleDataEvent listener for event emitter
     * 
     */
    onCandleDataEvent(fn) {

        this.eventEmitter.on(settings.socket.candleDataEvent, (data) => {

            fn(data);

        });
    }

    /**
     * xts-binary-packet listener for event emitter
     * 
     */
    onXTSBinaryPacketEvent(fn) {

        this.eventEmitter.on(settings.socket.xtsBinaryPacketEvent, (data) => {

            fn(data);

        });
    }

    /**
     * logout listener for event emitter
     * 
     */
    onLogout(fn) {

        this.eventEmitter.on(settings.socket.logout, (data) => {

            fn(data);

        });
    }

    async constructFullMarketDepthObject(messageCode, data) {
        var marketData = JSON.parse(data);
        if (marketData.Touchline.LastTradedTime)
            marketData.Touchline.LastTradedTime = this.getBarTimeFromTouchLineInfo(parseInt(marketData.Touchline.LastTradedTime), parseInt(marketData.ExchangeSegment));
        if (marketData.Touchline.LastUpdateTime)
            marketData.Touchline.LastUpdateTime = this.getBarTimeFromTouchLineInfo(parseInt(marketData.Touchline.LastUpdateTime), parseInt(marketData.ExchangeSegment));
                
        inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        return marketData;
    }

    async constructFullMarketDepthObjectBinaryData(messageCode, data) {
        var marketData = typeof data === "string" ? JSON.parse(data) : data;
            if (typeof marketData.ExchangeTimeStamp === "bigint") {
                marketData.ExchangeTimeStamp = Number(marketData.ExchangeTimeStamp);
            }
            if (typeof marketData.SequenceNumber === "bigint") {
                marketData.SequenceNumber = Number(marketData.SequenceNumber);
            }
            if (marketData.Touchline) {
                if (typeof marketData.Touchline.LastTradedTime === "bigint") {
                    // marketData.Touchline.LastTradedTime = this.getBarTimeFromTouchLineInfo(
                    //     Number(marketData.Touchline.LastTradedTime),
                    //     Number(marketData.ExchangeSegment)
                    // );
                    marketData.Touchline.LastTradedTime = Number(marketData.Touchline.LastTradedTime);
                }
                if (typeof marketData.Touchline.LastUpdateTime === "bigint") {
                    // marketData.Touchline.LastUpdateTime = this.getBarTimeFromTouchLineInfo(
                    //     Number(marketData.Touchline.LastUpdateTime),
                    //     Number(marketData.ExchangeSegment)
                    // );
                    marketData.Touchline.LastUpdateTime = Number(marketData.Touchline.LastUpdateTime);
                }
            }    
        // inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        return marketData;
    }
    

    async constructPartialMarketDepthObject(messageCode, data) {
        var marketData = {};
        marketData.Touchline = {};
        var depthLength = 5;

        linq.from(data.split(',')).select(function (keyValuePair) {
            var key = keyValuePair.split(':')[0];
            var value = keyValuePair.split(':')[1];

            switch (key) {
                case 't':
                    marketData.ExchangeSegment = value.split('_')[0];
                    marketData.ExchangeInstrumentID = value.split('_')[1];
                    break;
                case 'bi':
                    marketData.Bids = [];
                    var bids = value.split('|');
                    var index = 0;

                    for (var i = 0; i < depthLength; i++) {
                        var bidInfo = linq.from(bids).skip(index).take(4).toArray();

                        if (bidInfo.length > 0) {
                            marketData.Bids.push({
                                Index: bidInfo[0],
                                Size: bidInfo[1],
                                Price: bidInfo[2],
                                TotalOrders: bidInfo[3]
                            });
                        }

                        index = index + 4;
                    }
                    break;
                case 'ai':
                    marketData.Asks = [];
                    var asks = value.split('|');
                    var index = 0;

                    for (var i = 0; i < depthLength; i++) {
                        var askInfo = linq.from(asks).skip(index).take(4).toArray();

                        if (askInfo.length > 0) {
                            marketData.Asks.push({
                                Index: askInfo[0],
                                Size: askInfo[1],
                                Price: askInfo[2],
                                TotalOrders: askInfo[3]
                            });
                        }

                        index = index + 4;
                    }
                    break;
                case 'ltp':
                    marketData.Touchline.LastTradedPrice = value;
                    break;
                case 'ltq':
                    marketData.Touchline.LastTradedQunatity = value;
                    break;
                case 'tb':
                    marketData.Touchline.TotalBuyQuantity = value;
                    break;
                case 'ts':
                    marketData.Touchline.TotalSellQuantity = value;
                    break;
                case 'v':
                    marketData.Touchline.TotalTradedQuantity = value;
                    break;
                case 'ap':
                    marketData.Touchline.AverageTradedPrice = value;
                    break;
                case 'ltt':
                    marketData.Touchline.LastTradedTime = value;
                    break;
                case 'lut':
                    marketData.Touchline.LastUpdateTime = value;
                    break;
                case 'pc':
                    marketData.Touchline.PercentChange = value;
                    break;
                case 'o':
                    marketData.Touchline.Open = value;
                    break;
                case 'h':
                    marketData.Touchline.High = value;
                    break;
                case 'l':
                    marketData.Touchline.Low = value;
                    break;
                case 'c':
                    marketData.Touchline.Close = value;
                    break;
                case 'vp':
                    marketData.Touchline.TotalValueTraded = value;
                    break;
            }

            return keyValuePair;
        }).toArray();
        if (marketData.Touchline.LastTradedTime)
            marketData.Touchline.LastTradedTime = this.getBarTimeFromTouchLineInfo(parseInt(marketData.Touchline.LastTradedTime), parseInt(marketData.ExchangeSegment));

        if (marketData.Touchline.LastUpdateTime)
            marketData.Touchline.LastUpdateTime = this.getBarTimeFromTouchLineInfo(parseInt(marketData.Touchline.LastUpdateTime), parseInt(marketData.ExchangeSegment));

        var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID);


        if (subscribedStock) {
            if (subscribedStock.Touchline)
                subscribedStock.Touchline = Object.assign(subscribedStock.Touchline, marketData.Touchline);

            if (marketData.Bids) {
                linq.from(marketData.Bids).select(function (bid, index) {
                    if (bid.Index == 0) {
                        if (marketData.Bids[bid.Index].Size != '')
                            subscribedStock.Touchline.BidInfo.Size = marketData.Bids[bid.Index].Size;
                        if (marketData.Bids[bid.Index].Price != '')
                            subscribedStock.Touchline.BidInfo.Price = marketData.Bids[bid.Index].Price;
                        if (marketData.Bids[bid.Index].TotalOrders != '')
                            subscribedStock.Touchline.BidInfo.TotalOrders = marketData.Bids[bid.Index].TotalOrders;
                    }

                    if (bid.Size != '')
                        subscribedStock.Bids[bid.Index].Size = bid.Size;

                    if (bid.Price != '')
                        subscribedStock.Bids[bid.Index].Price = bid.Price;

                    if (bid.TotalOrders != '')
                        subscribedStock.Bids[bid.Index].TotalOrders = bid.TotalOrders;
                }).toArray();
            }

            if (marketData.Asks) {
                linq.from(marketData.Asks).select(function (ask, index) {
                    if (ask.Index == 0) {
                        if (marketData.Asks[ask.Index].Size != '')
                            subscribedStock.Touchline.AskInfo.Size = marketData.Asks[ask.Index].Size;
                        if (marketData.Asks[ask.Index].Price != '')
                            subscribedStock.Touchline.AskInfo.Price = marketData.Asks[ask.Index].Price;
                        if (marketData.Asks[ask.Index].TotalOrders != '')
                            subscribedStock.Touchline.AskInfo.TotalOrders = marketData.Asks[ask.Index].TotalOrders;
                    }

                    if (ask.Size != '')
                        subscribedStock.Asks[ask.Index].Size = ask.Size;

                    if (ask.Price != '')
                        subscribedStock.Asks[ask.Index].Price = ask.Price;

                    if (ask.TotalOrders != '')
                        subscribedStock.Asks[ask.Index].TotalOrders = ask.TotalOrders;
                }).toArray();
            }

            var finalSubscribedStock = Object.assign({}, subscribedStock);

            if (finalSubscribedStock.Touchline.LastTradedPrice && finalSubscribedStock.Touchline.PercentChange) {
                finalSubscribedStock.Touchline.PercentChange = parseFloat(finalSubscribedStock.Touchline.LastTradedPrice) == 0 ? "0.00" : parseFloat(finalSubscribedStock.Touchline.PercentChange).toFixed(2);
            }
            inMemoryStore.loadInMemory(finalSubscribedStock.messageCode, finalSubscribedStock.ExchangeSegment, finalSubscribedStock.ExchangeInstrumentID, finalSubscribedStock);
            return finalSubscribedStock;
        } else {
            inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
            return marketData;
        }
    }

    async constructPartialTouchlineBinaryData(messageCode, data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse data:", e);
                return null;
            }
        }
    
        var marketData = {};
        marketData.t = data.ExchangeSegment + "_" + data.ExchangeInstrumentID; // Unique identifier
        // marketData.tl = {}; 
        // marketData.Bids = [];
        // marketData.Asks = [];
    
        // Extract Touchline data
        if (data.Touchline && typeof data.Touchline === "object") {
            let touchline = data.Touchline;
    
            if (touchline.BidInfo) {
                let bidInfo = touchline.BidInfo;
                // marketData.Bids.push({ Index: 0, Size: bidInfo.Size, Price: bidInfo.Price, TotalOrders: bidInfo.TotalOrders });
                // marketData.bi = { s: bidInfo.Size, p: bidInfo.Price, o: bidInfo.TotalOrders };
                marketData.bi =  `${bidInfo.Size}|${bidInfo.Price}|${bidInfo.TotalOrders}|${bidInfo.BuyBackMarketMaker}` ;
            }
    
            if (touchline.AskInfo) {
                let askInfo = touchline.AskInfo;
                // marketData.Asks.push({ Index: 0, Size: askInfo.Size, Price: askInfo.Price, TotalOrders: askInfo.TotalOrders });
                // marketData.ai = { s: askInfo.Size, p: askInfo.Price, o: askInfo.TotalOrders };
                marketData.ai =  `${askInfo.Size}|${askInfo.Price}|${askInfo.TotalOrders}|${askInfo.BuyBackMarketMaker}` ;
            }
    
            if (touchline.LastTradedPrice !== undefined) marketData.ltp = touchline.LastTradedPrice;
            if (touchline.LastTradedQuantity !== undefined) marketData.ltq = touchline.LastTradedQuantity;
            if (touchline.TotalBuyQuantity !== undefined) marketData.tb = touchline.TotalBuyQuantity;
            if (touchline.TotalSellQuantity !== undefined) marketData.ts = touchline.TotalSellQuantity;
            if (touchline.TotalTradedQuantity !== undefined) marketData.v = touchline.TotalTradedQuantity;
            if (touchline.AverageTradedPrice !== undefined) marketData.ap = touchline.AverageTradedPrice;
            if (touchline.LastTradedTime !== undefined) marketData.ltt = Number(touchline.LastTradedTime);
            if (touchline.LastUpdateTime !== undefined) marketData.lut = Number(touchline.LastUpdateTime);
            if (touchline.PercentChange !== undefined) marketData.pc = touchline.PercentChange;
            if (touchline.Open !== undefined) marketData.o = touchline.Open;
            if (touchline.High !== undefined) marketData.h = touchline.High;
            if (touchline.Low !== undefined) marketData.l = touchline.Low;
            if (touchline.Close !== undefined) marketData.c = touchline.Close;
            if (touchline.TotalValueTraded !== undefined) marketData.vp = touchline.TotalValueTraded;
        }
    
        // Convert timestamps
        // if (marketData.ltt)
        //     marketData.ltt = this.getBarTimeFromTouchLineInfo(parseInt(marketData.ltt), parseInt(marketData.t.split("_")[0]));
    
        // if (marketData.lut)
        //     marketData.lut = this.getBarTimeFromTouchLineInfo(parseInt(marketData.lut), parseInt(marketData.t.split("_")[0]));
        
        return marketData;
        // var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1]);
    
        // if (subscribedStock) {
        //     if (subscribedStock.tl)
        //         subscribedStock.tl = Object.assign(subscribedStock.tl, marketData.tl);
            
        //         if (marketData.Bids.length > 0) {
        //             if (!subscribedStock.Bids) subscribedStock.Bids = [];
        //             marketData.Bids.forEach((bid, index) => {
        //                 if (bid.Index == 0) {
        //                     if (bid.Size !== '') subscribedStock.tl.bi.s = bid.Size;
        //                     if (bid.Price !== '') subscribedStock.tl.bi.p = bid.Price;
        //                     if (bid.TotalOrders !== '') subscribedStock.tl.bi.o = bid.TotalOrders;
        //                 }
        //                 if (!subscribedStock.Bids[index]) subscribedStock.Bids[index] = {};
        //                 if (bid.Size !== '') subscribedStock.Bids[index].Size = bid.Size;
        //                 if (bid.Price !== '') subscribedStock.Bids[index].Price = bid.Price;
        //                 if (bid.TotalOrders !== '') subscribedStock.Bids[index].TotalOrders = bid.TotalOrders;
        //             });
        //         }
        
        //         if (marketData.Asks.length > 0) {
        //             if (!subscribedStock.Asks) subscribedStock.Asks = [];
        //             marketData.Asks.forEach((ask, index) => {
        //                 if (ask.Index == 0) {
        //                     if (ask.Size !== '') subscribedStock.tl.ai.s = ask.Size;
        //                     if (ask.Price !== '') subscribedStock.tl.ai.p = ask.Price;
        //                     if (ask.TotalOrders !== '') subscribedStock.tl.ai.o = ask.TotalOrders;
        //                 }
        //                 if (!subscribedStock.Asks[index]) subscribedStock.Asks[index] = {};
        //                 if (ask.Size !== '') subscribedStock.Asks[index].Size = ask.Size;
        //                 if (ask.Price !== '') subscribedStock.Asks[index].Price = ask.Price;
        //                 if (ask.TotalOrders !== '') subscribedStock.Asks[index].TotalOrders = ask.TotalOrders;
        //             });
        //         }
    
        //     var finalSubscribedStock = Object.assign({}, subscribedStock);
    
        //     if (finalSubscribedStock.tl.ltp && finalSubscribedStock.tl.pc) {
        //         finalSubscribedStock.tl.pc = parseFloat(finalSubscribedStock.tl.ltp) == 0 ? "0.00" : parseFloat(finalSubscribedStock.tl.pc).toFixed(2);
        //     }
    
        //     inMemoryStore.loadInMemory(messageCode, finalSubscribedStock.t.split("_")[0], finalSubscribedStock.t.split("_")[1], finalSubscribedStock);
        //     return finalSubscribedStock;
        // } else {
        //     inMemoryStore.loadInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1], marketData);
        //     return marketData;
        // }
    }        
    
    async constructPartialMarketDepthObjectBinaryData(messageCode, data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse data:", e);
                return null;
            }
        }
    
        var marketData = {};
        marketData.t = data.ExchangeSegment + "_" + data.ExchangeInstrumentID; // Unique identifier
        // marketData.tl = {};
        // marketData.Bids = [];
        // marketData.Asks = [];
        var depthLength = 5; 
    
        // Extract Touchline data
        if (data.Touchline && typeof data.Touchline === "object") {
            let touchline = data.Touchline;
            marketData.ai = '';
            marketData.bi = '';
            
            if (Array.isArray(data.Asks)) {
                marketData.ai = data.Asks.slice(0, 5).map(ask =>
                    `${ask.Size}|${ask.Price}|${ask.TotalOrders}|${ask.BuyBackMarketMaker}`
                ).join("|");
            }
            if (Array.isArray(data.Bids)) {
                marketData.bi = data.Bids.slice(0, 5).map(bid =>
                    `${bid.Size}|${bid.Price}|${bid.TotalOrders}|${bid.BuyBackMarketMaker}`
                ).join("|");
            }
            // if (touchline.BidInfo) {
            //     let bidInfo = touchline.BidInfo;
            //     // marketData.Bids.push({ Index: 0, Size: bidInfo.Size, Price: bidInfo.Price, TotalOrders: bidInfo.TotalOrders });
            //     marketData.bi = { s: bidInfo.Size, p: bidInfo.Price, o: bidInfo.TotalOrders };
            // }
    
            // if (touchline.AskInfo) {
            //     let askInfo = touchline.AskInfo;
            //     // marketData.Asks.push({ Index: 0, Size: askInfo.Size, Price: askInfo.Price, TotalOrders: askInfo.TotalOrders });
            //     marketData.ai = { s: askInfo.Size, p: askInfo.Price, o: askInfo.TotalOrders };
            // }
    
            if (touchline.LastTradedPrice !== undefined) marketData.ltp = touchline.LastTradedPrice;
            if (touchline.LastTradedQuantity !== undefined) marketData.ltq = touchline.LastTradedQuantity;
            if (touchline.TotalBuyQuantity !== undefined) marketData.tb = touchline.TotalBuyQuantity;
            if (touchline.TotalSellQuantity !== undefined) marketData.ts = touchline.TotalSellQuantity;
            if (touchline.TotalTradedQuantity !== undefined) marketData.v = touchline.TotalTradedQuantity;
            if (touchline.AverageTradedPrice !== undefined) marketData.ap = touchline.AverageTradedPrice;
            if (touchline.LastTradedTime !== undefined) marketData.ltt = Number(touchline.LastTradedTime);
            if (touchline.LastUpdateTime !== undefined) marketData.lut = Number(touchline.LastUpdateTime);
            if (touchline.PercentChange !== undefined) marketData.pc = touchline.PercentChange;
            if (touchline.Open !== undefined) marketData.o = touchline.Open;
            if (touchline.High !== undefined) marketData.h = touchline.High;
            if (touchline.Low !== undefined) marketData.l = touchline.Low;
            if (touchline.Close !== undefined) marketData.c = touchline.Close;
            if (touchline.TotalValueTraded !== undefined) marketData.vp = touchline.TotalValueTraded;
        }
    
            // if (data.Bids && Array.isArray(data.Bids)) {
            //     marketData.Bids = data.Bids.slice(0, depthLength).map((bid, index) => ({
            //         Index: index,
            //         Size: bid.Size,
            //         Price: bid.Price,
            //         TotalOrders: bid.TotalOrders
            //     }));
            // }

            // marketData.Bids = Array.isArray(data.Bids)
            // ? data.Bids.slice(0, depthLength).map((bid, index) => ({
            //     Index: index,
            //     Size: bid.Size,
            //     Price: bid.Price,
            //     TotalOrders: bid.TotalOrders
            // }))
            // : [];
    
            // if (data.Asks && Array.isArray(data.Asks)) {
            //     marketData.Asks = data.Asks.slice(0, depthLength).map((ask, index) => ({
            //         Index: index,
            //         Size: ask.Size,
            //         Price: ask.Price,
            //         TotalOrders: ask.TotalOrders
            //     }));
            // }

            // marketData.Asks = Array.isArray(data.Asks)
            // ? data.Asks.slice(0, depthLength).map((ask, index) => ({
            //     Index: index,
            //     Size: ask.Size,
            //     Price: ask.Price,
            //     TotalOrders: ask.TotalOrders
            // }))
            // : [];
    
        // if (marketData.ltt)
        //     marketData.ltt = this.getBarTimeFromTouchLineInfo(parseInt(marketData.ltt), parseInt(marketData.t.split("_")[0]));
    
        // if (marketData.lut)
        //     marketData.lut = this.getBarTimeFromTouchLineInfo(parseInt(marketData.lut), parseInt(marketData.t.split("_")[0]));
        return marketData;
        // var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1]);
    
        // if (subscribedStock) {
        //     if (subscribedStock.tl)
        //         subscribedStock.tl = Object.assign(subscribedStock.tl, marketData.tl);
    
        //     // subscribedStock.Bids = marketData.Bids;
        //     // subscribedStock.Asks = marketData.Asks;

        //     // subscribedStock.Bids = [...marketData.Bids];
        //     // subscribedStock.Asks = [...marketData.Asks];

        //     if (marketData.Bids.length > 0) {
        //         if (!subscribedStock.Bids) subscribedStock.Bids = [];
        //         marketData.Bids.forEach((bid, index) => {
        //             if (bid.Index == 0) {
        //                 if (bid.Size !== '') subscribedStock.tl.bi.s = bid.Size;
        //                 if (bid.Price !== '') subscribedStock.tl.bi.p = bid.Price;
        //                 if (bid.TotalOrders !== '') subscribedStock.tl.bi.o = bid.TotalOrders;
        //             }
        //             if (!subscribedStock.Bids[index]) subscribedStock.Bids[index] = {};
        //             if (bid.Size !== '') subscribedStock.Bids[index].Size = bid.Size;
        //             if (bid.Price !== '') subscribedStock.Bids[index].Price = bid.Price;
        //             if (bid.TotalOrders !== '') subscribedStock.Bids[index].TotalOrders = bid.TotalOrders;
        //         });
        //     }
    
        //     if (marketData.Asks.length > 0) {
        //         if (!subscribedStock.Asks) subscribedStock.Asks = [];
        //         marketData.Asks.forEach((ask, index) => {
        //             if (ask.Index == 0) {
        //                 if (ask.Size !== '') subscribedStock.tl.ai.s = ask.Size;
        //                 if (ask.Price !== '') subscribedStock.tl.ai.p = ask.Price;
        //                 if (ask.TotalOrders !== '') subscribedStock.tl.ai.o = ask.TotalOrders;
        //             }
        //             if (!subscribedStock.Asks[index]) subscribedStock.Asks[index] = {};
        //             if (ask.Size !== '') subscribedStock.Asks[index].Size = ask.Size;
        //             if (ask.Price !== '') subscribedStock.Asks[index].Price = ask.Price;
        //             if (ask.TotalOrders !== '') subscribedStock.Asks[index].TotalOrders = ask.TotalOrders;
        //         });
        //     }
    
        //     var finalSubscribedStock = Object.assign({}, subscribedStock);
    
        //     if (finalSubscribedStock.tl.ltp && finalSubscribedStock.tl.pc) {
        //         finalSubscribedStock.tl.pc = parseFloat(finalSubscribedStock.tl.ltp) == 0 ? "0.00" : parseFloat(finalSubscribedStock.tl.pc).toFixed(2);
        //     }
    
        //     inMemoryStore.loadInMemory(messageCode, finalSubscribedStock.t.split("_")[0], finalSubscribedStock.t.split("_")[1], finalSubscribedStock);
        //     return finalSubscribedStock;
        // } else {
        //     inMemoryStore.loadInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1], marketData);
        //     return marketData;
        // }
    }
    

    getBarTimeFromTouchLineInfo(lastTradedTime, exchangeSegment) {
        var date = this.getBaseReferenceDate(exchangeSegment);
        return new Date(date.setSeconds(date.getSeconds() + lastTradedTime));
    }

    async constructFullIndexDataObject(messageCode, data) {
        var marketData = JSON.parse(data);
        inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        return marketData;
    }

    async constructPartialIndexDataObject(messageCode, data) {
        var marketData = {};

        linq.from(data.split(',')).select(function (keyValuePair) {
            var key = keyValuePair.split(':')[0];
            var value = keyValuePair.split(':')[1];

            switch (key) {
                case 't':
                    marketData.ExchangeSegment = value.split('_')[0];
                    marketData.IndexName = value.split('_')[1];
                    break;

                case 'ltp':
                    marketData.IndexValue = value;
                    break;
                case 'ltq':
                    marketData.LastTradedQunatity = value;
                    break;
                case 'lut':
                    marketData.ExchangeTimeStamp = value;
                    break;
                case 'yh':
                    marketData.YearlyHigh = value;
                    break;
                case 'yl':
                    marketData.YearlyLow = value;
                    break;

                case 'pc':
                    marketData.PercentChange = value;
                    break;
                case 'o':
                    marketData.OpeningIndex = value;
                    break;
                case 'h':
                    marketData.HighIndexValue = value;
                    break;
                case 'l':
                    marketData.LowIndexValue = value;
                    break;
                case 'c':
                    marketData.ClosingIndex = value;
                    break;

            }

            return keyValuePair;
        }).toArray();
        var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID);
        if (subscribedStock) {
            var finalSubscribedStock = merge(subscribedStock, marketData);
            inMemoryStore.loadInMemory(finalSubscribedStock.messageCode, finalSubscribedStock.ExchangeSegment, finalSubscribedStock.ExchangeInstrumentID, finalSubscribedStock);
            return finalSubscribedStock;
        } else {
            inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
            return marketData;
        }
    }

    async constructPartialOpenIntrestObject(messageCode, data) {
        var marketData = {};

        linq.from(data.split(',')).select(function (keyValuePair) {
            var key = keyValuePair.split(':')[0];
            var value = keyValuePair.split(':')[1];

            switch (key) {
                case 't':
                    marketData.ExchangeSegment = value.split('_')[0];
                    marketData.ExchangeInstrumentID = value.split('_')[1];
                    break;
                case 'o':
                    marketData.OpenInterest = value;
                    break;
            }
        }).toArray();
        var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID);
        if (subscribedStock) {
            var finalSubscribedStock = merge(subscribedStock, marketData);
            inMemoryStore.loadInMemory(finalSubscribedStock.messageCode, finalSubscribedStock.ExchangeSegment, finalSubscribedStock.ExchangeInstrumentID, finalSubscribedStock);
            return finalSubscribedStock;
        } else {
            inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
            return marketData;
        }
    }
    
    async constructBinaryPartialOpenIntrestObject(messageCode, data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error("Failed to parse data:", e);
                return null;
            }
        }
        var marketData = {};

        if (data) {
            marketData.t = data.ExchangeSegment + "_" + data.ExchangeInstrumentID; // Unique identifier

            if (data.OpenInterest !== undefined) marketData.o = data.OpenInterest;
            if (data.XTSMarketType !== undefined) marketData.mt = data.XTSMarketType;
            if (data.UnderlyingExchangeSegment !== undefined) marketData.uex = data.UnderlyingExchangeSegment;
            if (data.ExchangeTimeStamp !== undefined) marketData.et = data.ExchangeTimeStamp;
            if (data.UnderlyingInstrumentID !== undefined) marketData.uid = data.UnderlyingInstrumentID;
            if (data.UnderlyingTotalOpenInterest !== undefined) marketData.toi = data.UnderlyingTotalOpenInterest;

        }

        return marketData;

        
        // var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1]);
        // if (subscribedStock) {
        //     var finalSubscribedStock = merge(subscribedStock, marketData);
        //     inMemoryStore.loadInMemory(messageCode, finalSubscribedStock.t.split("_")[0], finalSubscribedStock.t.split("_")[1], finalSubscribedStock);
        //     return finalSubscribedStock;
        // } else {
        //     inMemoryStore.loadInMemory(messageCode, marketData.t.split("_")[0], marketData.t.split("_")[1], marketData);
        //     return marketData;
        // }
    }

    async constructPartialPropertyChangeEventObject(messageCode, data) {
        var marketData = {};

        linq.from(data.split(',')).select(function (keyValuePair) {
            var key = keyValuePair.split(':')[0];
            var value = keyValuePair.split(':')[1];

            switch (key) {
                case 't':
                    marketData.ExchangeSegment = value.split('_')[0];
                    marketData.ExchangeInstrumentID = value.split('_')[1];
                    break;
                case (settings.enums.InstrumentPropName.LowPriceRange).toString():
                    marketData.LowPriceRange = value;
                    break;

                case (settings.enums.InstrumentPropName.HighPriceRange).toString():
                    marketData.HighPriceRange = value;
                    break;
            }
        }).toArray();
        var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID);
        if (subscribedStock) {
            var finalSubscribedStock = merge(subscribedStock, marketData);
            inMemoryStore.loadInMemory(finalSubscribedStock.messageCode, finalSubscribedStock.ExchangeSegment, finalSubscribedStock.ExchangeInstrumentID, finalSubscribedStock);
            return finalSubscribedStock;
        } else {
            inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
            return marketData;
        }
    }

    async constructPartialCandleDataObject(messageCode, data) {
        var marketData = {};
        linq.from(data.split(',')).select(function (keyValuePair) {
            var key = keyValuePair.split(':')[0];
            var value = keyValuePair.split(':')[1];

            switch (key) {
                case 't':
                    marketData.t = value.split('_')[0] + "_" + value.split('_')[1];
                    break;
                case 'o':
                    marketData.o = value;
                    break;
                case 'h':
                    marketData.h = value;
                    break;
                case 'l':
                    marketData.l = value;
                    break;
                case 'c':
                    marketData.c = value;
                    break;
                case 'bt':
                    marketData.bt = value;
                    break;
                case 'bv':
                    marketData.bv = value;
                    break;
                case 'pv':
                    marketData.pv = value;
                    break;
            }
        }).toArray();

        return marketData;

        
        // var subscribedStock = inMemoryStore.getFromInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID);
        // if (subscribedStock) {
        //     var finalSubscribedStock = merge(subscribedStock, marketData);
        //     inMemoryStore.loadInMemory(finalSubscribedStock.messageCode, finalSubscribedStock.ExchangeSegment, finalSubscribedStock.ExchangeInstrumentID, finalSubscribedStock);
        //     return finalSubscribedStock;
        // } else {
        //     inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        //     return marketData;
        // }
    }

    async constructFullCandleDataObject(messageCode, data) {
        
        var marketData = JSON.parse(data);
        // inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        return marketData;
    }

    async constructFullOpenIntrestObject(messageCode, data) {
        var marketData = JSON.parse(data);
        inMemoryStore.loadInMemory(messageCode, marketData.ExchangeSegment, marketData.ExchangeInstrumentID, marketData);
        return marketData;
    }

    async constructFullMarketDepth100Object(messageCode, data) {
        return data;
    }

    async constructPartialMarketDepth100Object(messageCode, data) {
        return data;
    }
    getBaseReferenceDate(exchangeSegment) {
        switch (exchangeSegment) {
            case settings.enums.segments.NSECM:
            case settings.enums.segments.NSEFO:
            case settings.enums.segments.NSECD:
                return new Date(1980, 0, 1);
            default:
                return new Date(1970, 0, 1);
        }
    }
}