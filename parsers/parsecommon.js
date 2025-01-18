const {relativeTimeThreshold} = require('moment');

/**
 * @function ParseCommon
 * @description description
 */
function ParseCommon() {
    const oidLookups = {
        '.1.3.6.1.2.1.25.2.1.1': 'hrStorageOther',
        '.1.3.6.1.2.1.25.2.1.2': 'hrStorageRam',
        '.1.3.6.1.2.1.25.2.1.3': 'hrStorageVirtualMemory',
        '.1.3.6.1.2.1.25.2.1.4': 'hrStorageFixedDisk',
        '.1.3.6.1.2.1.25.2.1.5': 'hrStorageRemovableDisk',
        '.1.3.6.1.2.1.25.2.1.6': 'hrStorageFloppyDisk',
        '.1.3.6.1.2.1.25.2.1.7': 'hrStorageCompactDisc',
        '.1.3.6.1.2.1.25.2.1.8': 'hrStorageRamDisk',
        '.1.3.6.1.2.1.25.2.1.9': 'hrStorageFlashMemory',
        '.1.3.6.1.2.1.25.2.1.10': 'hrStorageNetworkDisk',
        '.1.3.6.1.4.1.14988.1': 'MIKROTIK-MIB::mikrotikExperimentalModule',
        '.1.3.6.1.2.1.31': 'IF-MIB::ifMIB',
        '.1.3.6.1.2.1.1': 'SNMPv2-MIB::system',
        '.1.3.6.1.2.1.17': 'BRIDGE-MIB::dot1dBridge',
        '.1.3.6.1.2.1.4': 'IP-MIB::ip',
        '.1.3.6.1.2.1.25.3.9.1': 'hrFSOther',
        '.1.3.6.1.2.1.25.3.9.2': 'hrFSUnknown',
        '.1.3.6.1.2.1.25.3.9.3': 'hrFSBerkeleyFFS',
        '.1.3.6.1.2.1.25.3.9.4': 'hrFSSys5FS',
        '.1.3.6.1.2.1.25.3.9.5': 'hrFSFat',
        '.1.3.6.1.2.1.25.3.9.6': 'hrFSHPFS',
        '.1.3.6.1.2.1.25.3.9.7': 'hrFSHFS',
        '.1.3.6.1.2.1.25.3.9.8': 'hrFSMFS',
        '.1.3.6.1.2.1.25.3.9.9': 'hrFSNTFS',
        '.1.3.6.1.2.1.25.3.9.10': 'hrFSVNode',
        '.1.3.6.1.2.1.25.3.9.11': 'hrFSJournaled',
        '.1.3.6.1.2.1.25.3.9.12': 'hrFSiso9660',
        '.1.3.6.1.2.1.25.3.9.13': 'hrFSRockRidge',
        '.1.3.6.1.2.1.25.3.9.14': 'hrFSNFS',
        '.1.3.6.1.2.1.25.3.9.15': 'hrFSNetware',
        '.1.3.6.1.2.1.25.3.9.16': 'hrFSAFS',
        '.1.3.6.1.2.1.25.3.9.17': 'hrFSDFS',
        '.1.3.6.1.2.1.25.3.9.18': 'hrFSAppleshare',
        '.1.3.6.1.2.1.25.3.9.19': 'hrFSRFS',
        '.1.3.6.1.2.1.25.3.9.20': 'hrFSDGCFS',
        '.1.3.6.1.2.1.25.3.9.21': 'hrFSBFS',
        '.1.3.6.1.2.1.25.3.9.22': 'hrFSFAT32',
        '.1.3.6.1.2.1.25.3.9.23': 'hrFSLinuxExt2',
        '.1.3.6.1.6.3.1': 'SNMPv2-MIB::snmpMIB',
        '.1.3.6.1.2.1.4.24': 'IP-FORWARD-MIB::ipForward',
        '.1.3.6.1.2.1.7': 'UDP-MIB::udp',
        '.1.3.6.1.2.1.6': 'TCP-MIB::tcp',
        '.1.3.6.1.2.1.47': 'ENTITY-MIB::entityMIB',
        '.1.3.111.2.802.1.1.2': 'IEEE8021-BRIDGE-MIB::ieee8021BridgeMib',
        '.1.3.111.2.802.1.1.4': 'IEEE8021-Q-BRIDGE-MIB::ieee8021QBridgeMib',
        '.1.2.840.10006.300.43': 'IEEE8023-LAG-MIB::lagMIB',
        '.1.3.111.2.802.1.1.13': 'LLDP-V2-MIB::lldpV2MIB',
        '.1.3.6.1.2.1.25.7.1': 'HOST-RESOURCES-MIB::hostResourcesMibModule',
        '.1.3.6.1.4.1.6876.1.10': 'VMWARE-SYSTEM-MIB::vmwSystemMIB',
        '.1.3.6.1.4.1.6876.2.10': 'VMWARE-VMINFO-MIB::vmwVmInfoMIB',
        '.1.3.6.1.4.1.6876.3.10': 'VMWARE-RESOURCES-MIB::vmwResourcesMIB',
        '.1.3.6.1.4.1.6876.4.90.10': 'VMWARE-CIMOM-MIB::vmwCIMOMMIB',
        '.1.3.6.1.4.1.6876.4.20': 'VMWARE-ENV-MIB::vmwEnv'
    };

    /**
     * @function ipToInt
     * @param {string} ip IPv4 address to be converted
     * @return {integer} This is teh IPv4 address in integer format
     * @description This function converts an IPv4 address to an integer
     */
    this.ipToInt = function (ip) {
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
    this.formatDT = function (item, sep) {
        return item.replace(/(?!^)(?=(?:\d{2})+(?:\.|$))/gm, sep);
    };

    /**
     *
     * @param {*} value
     * @param {*} type
     * @return {*}
     */
    this.convertHexString = function (value, type = 'ip') {
        const res = [];
        const mySplit = value.split(' ');
        let sep = ':';
        mySplit.forEach((item) => {
            if (type == 'ip') {
                res.push(item.toUpperCase());
            }
            if (type == 'hex-ascii') {
                const hex = item.toString();
                let str = '';
                for (let n = 0; n < hex.length; n += 2) {
                    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
                }
                res.push(str);
            }
            if (type != 'ip' && type != 'hex-ascii') {
                res.push(parseInt(item, 16).toString().padStart(2, '0'));
                sep = '.';
            }
        });
        return res.join(sep);
    };

    /**
     *
     * @param {*} value
     * @return {*}
     */
    this.convertIPv6String = function (value) {
        const res = [];
        const mySplit = value.split('.');
        mySplit.forEach((item) => {
            const tmp = item;
            res.push(tmp.toString(16).padStart(2, '0'));
        });
        return res.join(':');
    };

    /**
     *
     * @param {string} value
     * @return {string}
     */
    this.convertHexDate = function (value) {
        const mySplit = value.split(' ');
        let i = 0;
        let q = '';
        let res = '';
        mySplit.forEach((element) => {
            if (i < 2) {
                q += element;
            }
            if (i == 1) {
                res += this.convertHexString(q, 'other');
            }
            if (i > 1 && i != 7 && i != 8) {
                res += this.convertHexString(element, 'other');
            }

            if (i == 1 || i == 2) {
                res += '-';
            }

            if (i == 3) {
                res += 'T';
            }

            if (i == 4 || i == 5 || i == 9) {
                res += ':';
            }

            if (i == 8) {
                res += this.convertHexString(element, 'hex-ascii');
            }
            i++;
        });
        return res;
    };

    /**
     *
     * @param {*} value
     * @return {*}
     */
    this.converttoIPv6 = function (value) {
        const res = [];
        const mySplit = value.split('.');
        let i = 1;
        let prefix = '';
        mySplit.forEach((item2) => {
            const item = parseInt(item2);
            if (item != 0) {
                if (i < 3) {
                    prefix += item.toString(16);
                }
                if (i == 2) {
                    res.push(prefix + ':');
                }
                if (i > 2) {
                    res.push(item.toString(16));
                }
            }
            i++;
        });
        return res.join(':');
    };

    /**
     *
     * @param {string} value
     * @return {string}
     */
    this.lookupOID = function (value) {
        if (oidLookups[value]) {
            return oidLookups[value];
        } else {
            console.log('no OID lookups for ::' + value);
        }
        return value;
    };

    /**
     *
     * @param {*} value
     * @param {*} div
     * @return {*}
     */
    this.divNumber = function (value, div = 1000) {
        if (!isNaN(parseFloat(value)) && !isNaN(value - 0) && !isNaN(parseFloat(div)) && !isNaN(div - 0)) {
            return (value / div).toString();
        }
        return value;
    };

    /**
     *
     * @param {string} datatype datatype
     * @param {*} value datatype
     * @return {*} value
     * @description description
     */
    this.snmpFormatValue = function (datatype, value) {
        const fixvalue = value.trim();
        switch (datatype) {
            case 'STRING':
                return fixvalue.replace(/\\"$/, '').replace(/"$/, '').replace(/^"/, '');
            case 'INTEGER':
                return fixvalue;
            case 'Hex-STRING':
                return this.convertHexString(fixvalue, 'qwerty');
            case 'Hex-MAC':
                return this.convertHexString(fixvalue);
            case 'Hex-DATE':
                return this.convertHexDate(fixvalue);
            case 'IpAddress':
                return fixvalue;
            case 'Counter32':
                return fixvalue;
            case 'Counter64':
                return fixvalue;
            case 'Gauge32':
                return fixvalue;
            case 'Gauge64':
                return fixvalue;
            case 'Timeticks':
                return fixvalue;
            case 'OID':
                return this.lookupOID(fixvalue);
            case 'GDiv1000':
                return this.divNumber(fixvalue);
            case 'GDiv100':
                return this.divNumber(fixvalue, 100);
            default:
                console.log('unknown::' + datatype);
                return fixvalue;
        }
    };

    /*
    GDiv1000    GAUGE    /1000
    GDiv100    GAUGE    /100
    IDiv1000    INTEGER32    /1000
    */

    /**
     *
     * @param {object} data data
     * @param {object} queuename queuename
     * @param {object} caid caid
     * @param {object} _dataset dataset
     * @param {object} _definitions definitions
     * @return {object} value
     * @description description
     */
    this.buildSQLSNMPSimple = function (data, queuename, caid, _dataset, _definitions) {
        const payloads = [];
        data.forEach(function (entries) {
            Object.keys(entries.parsed).forEach(function (key) {
                let builtFields = '';
                let builtValues = '';
                let onDupFields = '';
                const newMsg = {
                    queuename: queuename,
                    data: {}
                };
                entries.parsed[key].sort(function (a, b) {
                    return a.order - b.order;
                }).forEach(function (kv) {
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
    this.buildSQLSNMPHeader = function (header, queuename, caid) {
        let key = 1;
        let builtFields = '';
        let builtValues = '';
        let sep = ', ';
        const newMsg = {
            queuename: queuename,
            data: {}
        };
        newMsg.data.service = header.tablename;
        Object.keys(header.data).forEach(function (entry) {
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
    /*     this.parseHeaderTable = function(data) {
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
        }; */

    this.ipaddressprefixindexes = function (data) {
        const ipv4 = '^(?<ifindex>[0-9]+)\\.(?<type>0|1|2|3|4|16)\\.(?<unknown0>0|1|2|3|4|16)\\.(?<prefix>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<length>[0-9]{1,3})$';
        const ipv6 = '^(?<ifindex>[0-9]+)\\.(?<type>0|1|2|3|4|16)\\.(?<unknown0>0|1|2|3|4|16)\\.(?<prefix>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<length>[0-9]{1,3})$';

        const getipv4 = new RegExp(ipv4);
        const getipv6 = new RegExp(ipv6);

        let indexes = {
            ifindex: data,
            type: data,
            prefix: data,
            length: data
        };

        const v4indexes = getipv4.exec(data);
        const v6indexes = getipv6.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        if (v6indexes) {
            indexes = v6indexes.groups;
            indexes.prefix = this.convertIPv6String(indexes.prefix);
        }
        delete indexes.unknown0;
        return indexes;
    };

    this.inetcidrrouteindexes = function (data) {
        const ipv4 = '^(?<desttype>0|1|2|3|4|16)\\.(?<unknown0>0|1|2|3|4|16)\\.(?<dest>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<pfxlen>[0-9]{1,3})\\.(?<policy>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<nexthoptype>0|1|2|3|4|16).(?<unknown1>[0-9])\\.(?<nexthop>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';
        const ipv6 = '^(?<desttype>0|1|2|3|4|16)\\.(?<unknown0>0|1|2|3|4|16)\\.(?<dest>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<pfxlen>[0-9]{1,3})\\.(?<policy>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<nexthoptype>0|1|2|3|4|16)\\.(?<unknown1>0|1|2|3|4|16)\\.(?<nexthop>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';

        const getipv4 = new RegExp(ipv4);
        const getipv6 = new RegExp(ipv6);

        let indexes = {
            desttype: data,
            dest: data,
            pfxlen: data,
            policy: data,
            nexthoptype: data,
            nexthop: data
        };

        const v4indexes = getipv4.exec(data);
        const v6indexes = getipv6.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        if (v6indexes) {
            indexes = v6indexes.groups;
            indexes.dest = this.converttoIPv6(indexes.dest);
            indexes.nexthop = this.converttoIPv6(indexes.nexthop);
        }
        delete indexes.unknown0;
        delete indexes.unknown1;
        return indexes;
    };

    this.ipaddressindexes = function (data) {
        const ipv4 = '^(?<addrtype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<addr>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';
        const ipv6 = '^(?<addrtype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<addr>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';

        const getipv4 = new RegExp(ipv4);
        const getipv6 = new RegExp(ipv6);

        let indexes = {
            addrtype: data,
            addr: data
        };

        const v4indexes = getipv4.exec(data);
        const v6indexes = getipv6.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        if (v6indexes) {
            indexes = v6indexes.groups;
            indexes.addr = this.convertIPv6String(indexes.addr);
        }
        delete indexes.unknown0;
        return indexes;
    };

    this.ipnettophysicalindexes = function (data) {
        const ipv4 = '^(?<ifindex>[0-9]{1,3})\\.(?<netaddresstype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<netaddress>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';
        const getipv4 = new RegExp(ipv4);

        let indexes = {
            ifindex: data,
            netaddresstype: data,
            netaddress: data
        };

        const v4indexes = getipv4.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        delete indexes.unknown0;
        return indexes;
    };


    this.tcpconnectionindexes = function (data) {
        const ipv4 = '^(?<localaddresstype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<localaddress>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<localport>[0-9]{1,5})\\.(?<remaddresstype>0|1|2|3|4|16)\\.(?<unknown1>[0-9]{1,3})\\.(?<remaddress>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<remport>[0-9]{1,5})';
        const getipv4 = new RegExp(ipv4);

        let indexes = {
            localaddresstype: data,
            localaddress: data,
            localport: data,
            remaddresstype: data,
            remaddress: data,
            remport: data
        };

        const v4indexes = getipv4.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        delete indexes.unknown0;
        return indexes;
    };

    this.tcplistenerindexes = function (data) {
        const ipv4 = '^(?<localaddresstype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<localaddress>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<localport>[0-9]{1,5})$';
        const ipv6 = '^(?<localaddresstype>0|1|2|3|4|16)\\.(?<unknown0>[0-9]{1,3})\\.(?<localaddress>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})\\.(?<localport>[0-9]{1,5})$';

        const getipv4 = new RegExp(ipv4);
        const getipv6 = new RegExp(ipv6);

        let indexes = {
            localaddresstype: data,
            localaddress: data,
            localport: data
        };

        const v4indexes = getipv4.exec(data);
        const v6indexes = getipv6.exec(data);

        if (v4indexes) {
            indexes = v4indexes.groups;
        }

        if (v6indexes) {
            indexes = v6indexes.groups;
            indexes.localaddress = this.convertIPv6String(indexes.localaddress);
        }
        delete indexes.unknown0;
        return indexes;
    };
}


module.commandName = 'ParseCommon';
module.exports = new ParseCommon();
module.helpText = 'Common functions for parsers';
