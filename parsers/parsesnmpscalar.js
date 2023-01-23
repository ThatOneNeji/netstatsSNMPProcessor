const parsecommon = require('./parsecommon');

/**
 * @function ParseSnmpScalar
 * @description description
 */
function ParseSnmpScalar() {
    /**
     *
     * @param {object} data data
     * @param {object} dataset dataset
     * @param {object} definitions definitions
     * @param {object} _Logger Logger
     * @param {object} oidoverrides
     * @return {object} value
     * @description description
     */
    this.parseSNMPScalar = function(data, dataset, definitions, _Logger, oidoverrides) {
        const regexParse = '^(?<mainoid>' + dataset.oid + '.)(?<oid>[0-9]+).(?<id>[0-9.]+) = (?<blank>""|(?<datatype>[A-Za-z0-9-]+): (?<value>"[a-zA-Z0-9-_.,:!()\/\\s\\S]+"|[a-zA-Z0-9-_.,:!()\/\\s\\S]+|""))';
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
            baseoid: dataset.oid + '.',
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
            lines.forEach(function(line) {
                reExec = reMask.exec(line);
                let res = {
                    raw: '',
                    id: '',
                    oid: '',
                    blank: ''
                };
                if (reExec) {
                    if ((typeof parsedGroups[reExec.groups.id]) === 'undefined') {
                        parsedGroups[reExec.groups.id] = [];
                    }
                    res = {
                        raw: line,
                        fulloid: reExec.groups.mainoid + reExec.groups.oid,
                        id: reExec.groups.id,
                        oid: reExec.groups.oid,
                        blank: reExec.groups.blank,
                        datatype: reExec.groups.datatype,
                        value: reExec.groups.value || ''
                    };

                    if (oidoverrides[res.fulloid]) {
                        res.datatype = oidoverrides[res.fulloid];
                    }

                    const rrrr = snmpSections[returnData.baseoid + res.oid];

                    if (typeof rrrr !== 'undefined' && rrrr) {
                        rrrr.value = parsecommon.snmpFormatValue(res.datatype, res.value);
                        parsedGroups[res.id].push(rrrr);

                        if (res.blank == '""') {
                            res.datatype = '';
                            res.value = '';
                            res.blank = '';
                        } else {
                            res.datatype = reExec.groups.datatype;
                            res.value = reExec.groups.value;
                        }
                    } else {
                        returnData.debug.push({
                            file: data.filename,
                            header: data.header,
                            dataset: dataset.name,
                            msg: 'Unknown OID',
                            regexParse: regexParse,
                            line: line,
                            results: res
                        });
                    }
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
        const cleanParsedGroups = {};
        if (Object.keys(parsedGroups).length) {
            Object.keys(parsedGroups).forEach(function(entry) {
                Object.keys(snmpIndexes).forEach(function(index) {
                    if (parsedGroups[entry].findIndex((x) => x.name === snmpIndexes[index].name) == -1) {
                        snmpIndexes[index].value = entry;
                        parsedGroups[entry].push(snmpIndexes[index]);
                    }
                });
                if (parsedGroups[entry].length) {
                    cleanParsedGroups[entry] = parsedGroups[entry];
                }
            });
        }
        returnData.parsed = cleanParsedGroups;
        if (returnData.debug.length) {
            console.log(returnData.debug);
        }
        return returnData;
    };
}

module.commandName = 'ParseSnmpScalar';
module.exports = new ParseSnmpScalar();
module.helpText = 'Parser for SNMP scalar types';