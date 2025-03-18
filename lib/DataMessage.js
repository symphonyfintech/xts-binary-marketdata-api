class DataMessage {
    constructor(messageCode, messageVersion, applicationType, tokenID) {
        this.MessageCode = messageCode;
        this.MessageVersion = messageVersion;
        this.ApplicationType = applicationType;
        this.TokenID = tokenID;
    }

    deserialize(binaryData, count) {
        try {
            if (!(binaryData instanceof DataView)) {
                binaryData = new DataView(binaryData.buffer, binaryData.byteOffset, binaryData.byteLength);
            }
            this.MessageCode = binaryData.getUint16(count,true);
            count += 2;

            this.MessageVersion = binaryData.getUint16(count,true);
            count += 2;

            this.ApplicationType = binaryData.getUint16(count,true);
            count += 2;

            this.TokenID = binaryData.getBigUint64(count,true);
            count += 8;

            if (this.MessageVersion === 4) {
                this.SequenceNumber = binaryData.getBigUint64(count,true);
                count += 8;
            }

            count += 4; // Skipping additional bytes
            return count;
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = DataMessage;