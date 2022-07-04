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
     * @return {object} value
     * @description description
     */
    this.parseSNMPTable = function(data, dataset, definitions, Logger) {
        const regexParse = '^(' + dataset.oid + '.1.)(?<oid>[0-9]+).(?<id>[0-9.]+) = (?<blank>""|(?<datatype>[A-Za-z0-9-]+): (?<value>"[a-zA-Z0-9-_.,:!()\/\\s\\S]+"|[a-zA-Z0-9-_.,:!()\/\\s\\S]+|""))';
        const newID = '.(?<newID>[0-9]+)$';
        const ipCidrRouteIndexRegex = '^(?<RouteDest>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}).(?<RouteMask>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}).(?<RouteTos>[0-9]{1,3}).(?<RouteNextHop>[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})$';
        const lines2 = data.rawdata.split('\n');
        const lines = [];
        lines2.forEach((line) => {
            lines.push(line.replace(/iso.3.6.1/g, '.1.3.6.1'));
        });
        const snmpSections = {};
        const snmpIndexes = {};
        dataset.objects.forEach((section) => {
            Object.keys(section).forEach(function(entry) {
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
            headertablerequired: '',
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
            lines.forEach(function(line) {
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
            Object.keys(parsedGroups).forEach(function(entry) {
                Object.keys(snmpIndexes).forEach(function(index) {
                    if (parsedGroups[entry].findIndex((x) => x.name === snmpIndexes[index].name) == -1) {
                        const tempIdx = JSON.parse(JSON.stringify(snmpIndexes[index]));
                        tempIdx.value = entry;
                        if (data.header.type == 'T05' && index == '.1.3.6.1.2.1.25.3.2.1.3.4') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }
                        if (data.header.type == 'T22' && index == '.1.3.6.1.2.1.25.3.3.1.1') {
                            tempIdx.value = entry;
                        }
                        if (data.header.type == 'T07' && index == '.1.3.6.1.2.1.4.24.4.1.1') {
                            const getNewID = new RegExp(ipCidrRouteIndexRegex);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.RouteDest;
                        }
                        if (data.header.type == 'T07' && index == '.1.3.6.1.2.1.4.24.4.1.2') {
                            const getNewID = new RegExp(ipCidrRouteIndexRegex);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.RouteMask;
                        }
                        if (data.header.type == 'T07' && index == '.1.3.6.1.2.1.4.24.4.1.3') {
                            const getNewID = new RegExp(ipCidrRouteIndexRegex);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.RouteTos;
                        }
                        if (data.header.type == 'T07' && index == '.1.3.6.1.2.1.4.24.4.1.4') {
                            const getNewID = new RegExp(ipCidrRouteIndexRegex);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.RouteNextHop;
                        }
                        if (data.header.type == 'T16' && index == '.1.3.6.1.4.1.14988.1.1.1.2.1.2') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }
                        if (data.header.type == 'T43') {
                            const getNewID = new RegExp(newID);
                            const reID = getNewID.exec(entry);
                            tempIdx.value = reID.groups.newID;
                        }
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