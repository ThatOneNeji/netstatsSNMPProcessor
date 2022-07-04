/**
 * @function ParseCommon
 * @description description
 */
function ParseCommon() {
    /**
     * @function ipToInt
     * @param {string} ip IPv4 address to be converted
     * @return {integer} This is teh IPv4 address in integer format
     * @description This function converts an IPv4 address to an integer
     */
    this.ipToInt = function(ip) {
        const parts = ip.split('.');
        return ((parts[0] * (256 * 256 * 256)) + (parts[1] * (256 * 256)) + (parts[2] * 256) + Number(parts[3]));
    };

    /**
     *
     * @param {*} item
     * @param {*} sep
     * @return {*}
     * @description description
     */
    this.formatDT = function(item, sep) {
        return item.replace(/(?!^)(?=(?:\d{2})+(?:\.|$))/gm, sep);
    };

    /**
     *
     * @param {*} value
     * @return {*}
     */
    this.convertHexString = function(value) {
        console.log('convertHexString  ==>  value:' + value);
        const res = [];
        const mySplit = value.split(' ');
        mySplit.forEach((item) => {
            res.push(parseInt(item, 16));
        });
        return res.join(':');
    };

    /**
     *
     * @param {string} datatype datatype
     * @param {*} value datatype
     * @return {*} value
     * @description description
     */
    this.snmpFormatValue = function(datatype, value) {
        const fixvalue = value.trim();
        switch (datatype) {
            case 'STRING':
                return fixvalue.replace(/\\"$/, '').replace(/"$/, '').replace(/^"/, '');
            case 'INTEGER':
                return fixvalue;
            case 'Hex-STRING':
                return this.convertHexString(fixvalue);
            case 'IpAddress':
                return fixvalue;
            case 'Counter32':
                return fixvalue;
            default:
                return fixvalue;
        }
    };


    /**
     *
     * @param {object} data data
     * @param {object} queuename queuename
     * @param {object} caid caid
     * @param {object} dataset dataset
     * @param {object} definitions definitions
     * @return {object} value
     * @description description
     */
    this.buildSQLSNMPSimple = function(data, queuename, caid, dataset, definitions) {
        const payloads = [];
        data.forEach(function(entries) {
            Object.keys(entries.parsed).forEach(function(key) {
                let builtFields = '';
                let builtValues = '';
                let onDupFields = '';
                const newMsg = {
                    queuename: queuename,
                    data: {}
                };
                entries.parsed[key].sort(function(a, b) {
                    return a.order - b.order;
                }).forEach(function(kv) {
                    builtFields += ', ' + kv.name.toLowerCase();
                    builtValues += ', \'' + kv.value.replaceAll('\'', '\'\'') + '\'';
                    onDupFields += ',' + kv.name.toLowerCase() + ' = \'' + kv.value.replaceAll('\'', '\'\'') + '\'';
                });
                newMsg.data.service = entries.tablename.toLowerCase();
                const sqlFields = 'INSERT INTO ' + entries.tablename.toLowerCase() + ' (rdate, host' + builtFields + ') ';
                const sqlValues = 'VALUES (\'' + entries.rdate + '\',\'' + entries.source + '\'' + builtValues + ') ';
                const sqlDuplicate = ' ON DUPLICATE KEY UPDATE processed = \'n\' ' + onDupFields + ' ;';
                newMsg.data.sql = sqlFields + sqlValues + sqlDuplicate;
                newMsg.data.caid = caid;
                payloads.push(newMsg);
            });
        });
        return payloads;
    };


    /**
     * @function buildSQLSNMPHeader
     * @param {object} header parsed
     * @param {string} queuename fn
     * @param {string} caid publishBaseName
     * @return {object} value
     * @description description
     */
    this.buildSQLSNMPHeader = function(header, queuename, caid) {
        let key = 1;
        let builtFields = '';
        let builtValues = '';
        let sep = ', ';
        const newMsg = {
            queuename: queuename,
            data: {}
        };
        newMsg.data.service = header.tablename;
        Object.keys(header.data).forEach(function(entry) {
            if (key === Object.keys(header.data).length) {
                sep = '';
            }
            builtFields += entry.toLowerCase() + sep;
            builtValues += '\'' + header.data[entry] + '\'' + sep;
            key++;
        });
        const sqlFields = 'INSERT INTO ' + header.tablename.toLowerCase() + ' (' + builtFields + ') ';
        const sqlValues = 'VALUES (' + builtValues + ') ';
        const sqlDuplicate = ' ON DUPLICATE KEY UPDATE processed = \'n\' ;';
        newMsg.data.sql = sqlFields + sqlValues + sqlDuplicate;
        newMsg.data.caid = caid;
        return newMsg;
    };

    /**
     * @function parseHeaderTable
     * @param {object} data data
     * @return {object} value
     * @description description
     */
    this.parseHeaderTable = function(data) {
        const header = {
            data: {
                rdate: data.header.rdate,
                cdate: data.header.cdate,
                host: data.header.host,
                filesize: data.header.size
            },
            tablename: 'section.headertable'
        };
        return header;
    };
}


module.commandName = 'ParseCommon';
module.exports = new ParseCommon();
module.helpText = 'Common functions for parsers';