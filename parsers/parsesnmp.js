const parsesnmptable = require('./parsesnmptable');
const parsecommon = require('./parsecommon');
const parsesnmpscalar = require('./parsesnmpscalar');
const nanoConst = BigInt(1000000);

/**
 * @function ParseSnmp
 * @description description
 */
function ParseSnmp() {
    /**
     * @function parseSNMP
     * @param {object} data data
     * @param {string} queuename queuename
     * @param {object} dataset dataset
     * @param {object} definitions definitions
     * @param {object} Logger Logger
     * @return {object} value
     * @description description
     */
    this.parseSNMP = function(data, queuename, dataset, definitions, Logger) {
        return new Promise(function(resolve, reject) {
            switch (dataset.type) {
                case 'table':
                    data.parsed.sections.push(parsesnmptable.parseSNMPTable(data, dataset, definitions, Logger));
                    break;
                case 'scalar':
                    data.parsed.sections.push(parsesnmpscalar.parseSNMPScalar(data, dataset, definitions, Logger));
                    break;
                default:
                    console.error('Unknown type: ' + dataset.type);
            }
            resolve(data);
        }).then(function(result) {
            return result;
        }).then(function(result) {
            data.sql = parsecommon.buildSQLSNMPSimple(data.parsed.sections, queuename, data.caid, dataset, definitions);
            if (data.parsed.header.data) {
                data.sql.push(parsecommon.buildSQLSNMPHeader(data.parsed.header, queuename, data.caid));
            }
            return result;
        }).then(function(result) {
            data.parsed.sections.forEach((section) => {
                section.timeend = process.hrtime.bigint();
                section.timetaken = (section.timeend - section.timestart) / nanoConst;
            });
            return result;
        });
    };
}


module.commandName = 'ParseSnmp';
module.exports = new ParseSnmp();
module.helpText = 'Main SNMP Parser';