const parsecommon = require('./parsecommon');

/**
 * @function ParseSnmpTable
 * @description description
 */
function ParseSnmpTable() {
    /**
     * @function parseSNMPTable
     * @param {object} data data
     * @param {object} dataset dataset
     * @param {object} definitions definitions
     * @param {object} Logger Logger
     * @param {object} oidoverrides
     * @return {object} value
     * @description description
     */
    this.parseSNMPTable = function (data, dataset, definitions, Logger, oidoverrides) {
        const regexParse = '^(?<mainoid>' + dataset.oid + '.1.)(?<oid>[0-9]+).(?<id>[0-9.]+) = (?<blank>""|(?<datatype>[A-Za-z0-9-]+): (?<value>"[a-zA-Z0-9-_.,:!()\/\\s\\S]+"|[a-zA-Z0-9-_.,:!()\/\\s\\S]+|""))';
        const newID = '.(?<newID>[0-9]+)$';
        const ipCidrRouteIndexRegex = '^(?<RouteDest>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}).(?<RouteMask>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}).(?<RouteTos>[0-9]{1,3}).(?<RouteNextHop>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';
        const ipv6addrRegex = '^(?<interface_id>[0-9]+)\\.(?<ipv6>.*)$';
        const lines2 = data.rawdata.split('\n');
        const lines = [];
        lines2.forEach((line) => {
            lines.push(line.replace(/iso.3.6.1/g, '.1.3.6.1'));
        });
        const snmpSections = {};
        const snmpIndexes = {};
        dataset.objects.forEach((section) => {
            Object.keys(section).forEach(function (entry) {
                snmpSections[entry] = section[entry];
                if (section[entry].columntype == 'index') {
                    snmpIndexes[entry] = section[entry];
                }
            });
        });
        const fileHeaders = {
            start: 'MIB_SNMP_' + dataset.name,
            end: 'MIB_SNMP_' + dataset.name + '_END'
        };
        const returnData = {
            tablename: definitions.tables.base.prefix + '_' + dataset.name.replace('Table', '') + '_' + definitions.tables.base.suffix,
            snmpname: '',
            baseoid: dataset.oid + '.1.',
            status: 'success',
            debug: [],
            timestart: process.hrtime.bigint(),
            timeend: '',
            timetaken: '',
            data: [],
            headertablerequired: false,
            source: data.header.host,
            rdate: data.header.rdate
        };
        const reMask = new RegExp(regexParse);
        const parsedGroups = {};
        let reExec;
        if (!lines[lines.length - 1]) {
            lines.splice(-1, 1);
        }

        // check for old school headers
        if ((lines[0].toUpperCase() == fileHeaders.start.toUpperCase()) && (lines[lines.length - 1].toUpperCase() == fileHeaders.end.toUpperCase())) {
            lines.splice(-1, 1);
            lines.splice(0, 1);
        }

        if (lines.length) {
            lines.forEach(function (line) {
                reExec = reMask.exec(line);
                let res = {
                    raw: '',
                    id: '',
                    oid: '',
                    blank: ''
                };
                if (reExec) {
                    res = {
                        raw: line,
                        fulloid: reExec.groups.mainoid + reExec.groups.oid,
                        id: reExec.groups.id,
                        oid: reExec.groups.oid,
                        blank: reExec.groups.blank,
                        datatype: reExec.groups.datatype || '',
                        value: reExec.groups.value || ''
                    };

                    if ((typeof parsedGroups[res.id]) === 'undefined') {
                        parsedGroups[res.id] = [];
                    }

                    if (res.blank == '""') {
                        res.datatype = '';
                        res.value = '';
                        res.blank = '';
                    } else {
                        res.datatype = reExec.groups.datatype;
                        res.value = reExec.groups.value;
                    }

                    if (res.fulloid in oidoverrides) {
                        res.datatype = oidoverrides[res.fulloid];
                    }

                    const rrrr = JSON.parse(JSON.stringify(snmpSections[returnData.baseoid + res.oid]));

                    rrrr.value = parsecommon.snmpFormatValue(res.datatype, res.value);

                    parsedGroups[res.id].push(rrrr);
                } else {
                    returnData.debug.push({
                        file: data.filename,
                        header: data.header,
                        dataset: dataset.name,
                        msg: 'Regex failed',
                        regexParse: regexParse,
                        line: line
                    });
                }
            });
        } else {
            returnData.debug.push({
                file: data.filename,
                header: data.header,
                dataset: dataset.name,
                msg: 'No lines to parse'
            });
        }
        if (Object.keys(parsedGroups).length) {
            Object.keys(parsedGroups).forEach(function (entry) {
                Object.keys(snmpIndexes).forEach(function (index) {
                    if (parsedGroups[entry].findIndex((x) => x.name === snmpIndexes[index].name) == -1) {
                        const tempIdx = JSON.parse(JSON.stringify(snmpIndexes[index]));
                        tempIdx.value = entry;
                        /* hrDeviceTable */
                        if (data.header.type == 'T05' && index == '.1.3.6.1.2.1.25.3.2.1.3.4') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }

                        /* ipCidrRouteTable */
                        if (data.header.type == 'T07') {
                            if (index == '.1.3.6.1.2.1.4.24.4.1.1') {
                                const getNewID = new RegExp(ipCidrRouteIndexRegex);
                                const reID = getNewID.exec(entry);
                                tempIdx.value = reID.groups.RouteDest;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.4.1.2') {
                                const getNewID = new RegExp(ipCidrRouteIndexRegex);
                                const reID = getNewID.exec(entry);
                                tempIdx.value = reID.groups.RouteMask;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.4.1.3') {
                                const getNewID = new RegExp(ipCidrRouteIndexRegex);
                                const reID = getNewID.exec(entry);
                                tempIdx.value = reID.groups.RouteTos;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.4.1.4') {
                                const getNewID = new RegExp(ipCidrRouteIndexRegex);
                                const reID = getNewID.exec(entry);
                                tempIdx.value = reID.groups.RouteNextHop;
                            }
                        }

                        /* mtxrWlRtabTable */
                        if (data.header.type == 'T16' && index == '.1.3.6.1.4.1.14988.1.1.1.2.1.2') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }

                        /* hrProcessorTable */
                        if (data.header.type == 'T22' && index == '.1.3.6.1.2.1.25.3.3.1.1') {
                            tempIdx.value = entry;
                        }

                        /* mtxrWlCMRtabTable */
                        if (data.header.type == 'T43') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }

                        /* ipv6AddrTable */
                        if (data.header.type == 'T50') {
                            const getNewID = new RegExp(ipv6addrRegex);
                            const reID = getNewID.exec(entry);
                            if (reID) {
                                console.log(reID.groups.ipv6);
                                console.log(parsecommon.converttoIPv6(reID.groups.ipv6));
                                tempIdx.value = parsecommon.converttoIPv6(reID.groups.ipv6);
                            } else {
                                tempIdx.value = entry;
                            }
                        }

                        /* icmpMsgStatsTable */
                        if (data.header.type == 'T62') {
                            const reID = entry.split('.');
                            console.log(reID);
                            if (index == '.1.3.6.1.2.1.5.30.1.1') {
                                tempIdx.value = reID[0];
                            }
                            if (index == '.1.3.6.1.2.1.5.30.1.2') {
                                tempIdx.value = reID[1];
                            }
                        }

                        /* inetCidrRouteTable */
                        if (data.header.type == 'T65') {
                            const indexes = parsecommon.inetcidrrouteindexes(entry);
                            if (index == '.1.3.6.1.2.1.4.24.7.1.1') {
                                tempIdx.value = indexes.desttype;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.7.1.2') {
                                tempIdx.value = indexes.dest;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.7.1.3') {
                                tempIdx.value = indexes.pfxlen;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.7.1.4') {
                                tempIdx.value = indexes.policy;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.7.1.5') {
                                tempIdx.value = indexes.nexthoptype;
                            }
                            if (index == '.1.3.6.1.2.1.4.24.7.1.6') {
                                tempIdx.value = indexes.nexthop;
                            }
                        }

                        /* ipAddressPrefixTable */
                        if (data.header.type == 'T66') {
                            const indexes = parsecommon.ipaddressprefixindexes(entry);
                            if (index == '.1.3.6.1.2.1.4.32.1.1') {
                                tempIdx.value = indexes.ifindex;
                            }
                            if (index == '.1.3.6.1.2.1.4.32.1.2') {
                                tempIdx.value = indexes['type'];
                            }
                            if (index == '.1.3.6.1.2.1.4.32.1.3') {
                                tempIdx.value = indexes.prefix;
                            }
                            if (index == '.1.3.6.1.2.1.4.32.1.4') {
                                tempIdx.value = indexes['length'];
                            }
                        }

                        /* ipAddressTable */
                        if (data.header.type == 'T67') {
                            const indexes = parsecommon.ipaddressindexes(entry);
                            if (index == '.1.3.6.1.2.1.4.34.1.1') {
                                tempIdx.value = indexes.addrtype;
                            }
                            if (index == '.1.3.6.1.2.1.4.34.1.2') {
                                tempIdx.value = indexes.addr;
                            }
                        }

                        /* ipNetToPhysicalTable */
                        if (data.header.type == 'T68') {
                            const indexes = parsecommon.ipnettophysicalindexes(entry);
                            if (index == '.1.3.6.1.2.1.4.35.1.1') {
                                tempIdx.value = indexes.ifindex;
                            }
                            if (index == '.1.3.6.1.2.1.4.35.1.2') {
                                tempIdx.value = indexes.netaddresstype;
                            }
                            if (index == '.1.3.6.1.2.1.4.35.1.3') {
                                tempIdx.value = indexes.netaddress;
                            }
                        }

                        /* tcpConnectionTable */
                        if (data.header.type == 'T71') {
                            const indexes = parsecommon.tcpconnectionindexes(entry);
                            if (index == '.1.3.6.1.2.1.6.19.1.1') {
                                tempIdx.value = indexes.localaddresstype;
                            }
                            if (index == '.1.3.6.1.2.1.6.19.1.2') {
                                tempIdx.value = indexes.localaddress;
                            }
                            if (index == '.1.3.6.1.2.1.6.19.1.3') {
                                tempIdx.value = indexes.localport;
                            }
                            if (index == '.1.3.6.1.2.1.6.19.1.4') {
                                tempIdx.value = indexes.remaddresstype;
                            }
                            if (index == '.1.3.6.1.2.1.6.19.1.5') {
                                tempIdx.value = indexes.remaddress;
                            }
                            if (index == '.1.3.6.1.2.1.6.19.1.6') {
                                tempIdx.value = indexes.remport;
                            }
                        }

                        /* tcpListenerTable */
                        if (data.header.type == 'T72') {
                            const indexes = parsecommon.tcplistenerindexes(entry);
                            if (index == '.1.3.6.1.2.1.6.20.1.1') {
                                tempIdx.value = indexes.localaddresstype;
                            }
                            if (index == '.1.3.6.1.2.1.6.20.1.2') {
                                tempIdx.value = indexes.localaddress;
                            }
                            if (index == '.1.3.6.1.2.1.6.20.1.3') {
                                tempIdx.value = indexes.localport;
                            }
                        }

                        // T66 ipAddressPrefixTable
                        /*                             desttype: '2',
                          dest: 'ff:2:0:0:0:0:0:0:0:0:0:0:0:0:0:0',
                          pfxlen: '1.2.0.0',
                          nexthoptype: '2',
                          nexthop: 'fe:80:0:0:0:0:0:0:2:50:56:ff:fe:66:f6:ea' */
                        parsedGroups[entry].push(tempIdx);
                    }
                });
            });
        }
        returnData.parsed = parsedGroups;

        if (returnData.debug.length) {
            Logger.warn(returnData.debug);
        }
        return returnData;
    };
}


module.commandName = 'ParseSnmpTable';
module.exports = new ParseSnmpTable();
module.helpText = 'Parser for SNMP table types';
