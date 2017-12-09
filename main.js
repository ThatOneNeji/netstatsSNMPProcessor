var appConfig = require('./settings.json');
var log4js = require('log4js');
var moment = require('moment');
var mibConfig = require('./mib.json');

function bail(err) {
    logger.error(err);
    process.exit(1);
}

function initLogger() {
    log4js.configure({
        appenders: {
            out: {type: 'console'},
            task: {
                type: 'file',
                filename: 'logs/nodeSNMPProcessor.log',
                maxLogSize: 1048576,
                backups: 5
            }
        },
        categories: {
            default: {appenders: ['out', 'task'], level: 'debug'},
            task: {appenders: ['task'], level: 'error'}
        }
    });
}

function publisher(queuename, msg) {
    open.then(function (conn) {
        return conn.createChannel();
    }).then(function (ch) {
        return ch.assertQueue(queuename).then(function (ok) {
            ch.sendToQueue(queuename, new Buffer(JSON.stringify(msg)));
            try {
                return ch.close();
            } catch (alreadyClosed) {
                logger.error(alreadyClosed.stackAtStateChange);
            }
        });
    }).catch(console.warn);
}

function processifMIB(snmpdata, host, rdate, servicename) {
    logger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    interface = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_ifmib_raw(RDate, host, ifIndex, ifDescr, ifType, ifMtu, ifSpeed, ifPhysAddress, ifAdminStatus, ifOperStatus, ifLastChange, ifInOctets, ifInUcastPkts, ifInNUcastPkts, ifInDiscards, ifInErrors, ifInUnknownProtos, ifOutOctets, ifOutUcastPkts, ifOutNUcastPkts, ifOutDiscards, ifOutErrors, ifOutQLen, ifSpecific)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + interface.ifindex + "', '" + interface.ifdescr + "', '" + interface.iftype + "', '" + interface.ifmtu + "', '" + interface.ifspeed + "', '" + interface.ifphysaddress + "', '" + interface.ifadminstatus + "', '" + interface.ifoperstatus + "', '" + interface.iflastchange + "', '" + interface.ifinoctets + "', '" + interface.ifinucastpkts + "', '" + interface.ifinnucastpkts + "', '" + interface.ifindiscards + "', '" + interface.ifinerrors + "', '" + interface.ifinunknownprotos + "', '" + interface.ifoutoctets + "', '" + interface.ifoutucastpkts + "', '" + interface.ifoutnucastpkts + "', '" + interface.ifoutdiscards + "', '" + interface.ifouterrors + "', '" + interface.ifoutqlen + "', '" + interface.ifspecific + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'n' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    publisher(appConfig.amqp.mysqlqueuename, newMsg);
}

function processhost_resources_processor(snmpdata, host, rdate, servicename, id) {
    logger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_host_resources_processor_raw(RDate, host, hrprocessorfrwid, hrprocessorload)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + id + "', '" + processor.hrprocessorload + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    publisher(appConfig.amqp.mysqlqueuename, newMsg);
}

function makeMacAddr(mac_add_raw) {
    var str = mac_add_raw;
    var res = str.match(/.{1,2}/g);
    var rrr = res[0].toUpperCase() + ':' + res[1].toUpperCase() + ':' + res[2].toUpperCase() + ':' + res[3].toUpperCase() + ':' + res[4].toUpperCase() + ':' + res[5].toUpperCase();
    return rrr;
}

function processmikrotik_ap_client(snmpdata, host, rdate, servicename, id) {
    logger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    makeMacAddr(processor.mtxrwlrtabaddr);
    sqlFields = "INSERT INTO tbl_base_snmp_mikrotik_ap_client_raw(RDate, host, mtxrwlrtabaddr, mtxrwlrtabiface, mtxrwlrtabstrength, mtxrwlrtabtxbytes, mtxrwlrtabrxbytes, mtxrwlrtabtxpackets, mtxrwlrtabrxpackets, mtxrwlrtabtxrate, mtxrwlrtabrxrate, mtxrwlrtabrouterosversion, mtxrwlrtabuptime, mtxrwlrtabsignaltonoise, mtxrwlrtabtxstrengthch0, mtxrwlrtabrxstrengthch0, mtxrwlrtabtxstrengthch1, mtxrwlrtabrxstrengthch1, mtxrwlrtabtxstrengthch2, mtxrwlrtabrxstrengthch2, mtxrwlrtabtxstrength)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + makeMacAddr(processor.mtxrwlrtabaddr) + "', '" + id + "', '" + processor.mtxrwlrtabstrength + "', '" + processor.mtxrwlrtabtxbytes + "', '" + processor.mtxrwlrtabrxbytes + "', '" + processor.mtxrwlrtabtxpackets + "', '" + processor.mtxrwlrtabrxpackets + "', '" + processor.mtxrwlrtabtxrate + "', '" + processor.mtxrwlrtabrxrate + "', '" + processor.mtxrwlrtabrouterosversion + "', '" + processor.mtxrwlrtabuptime + "', '" + processor.mtxrwlrtabsignaltonoise + "', '" + processor.mtxrwlrtabtxstrengthch0 + "', '" + processor.mtxrwlrtabrxstrengthch0 + "', '" + processor.mtxrwlrtabtxstrengthch1 + "', '" + processor.mtxrwlrtabrxstrengthch1 + "', '" + processor.mtxrwlrtabtxstrengthch2 + "', '" + processor.mtxrwlrtabrxstrengthch2 + "', '" + processor.mtxrwlrtabtxstrength + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' and ldate = now();";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    publisher(appConfig.amqp.mysqlqueuename, newMsg);
}

function processmikrotik_queuetree(snmpdata, host, rdate, servicename, id) {
    logger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_mikrotik_queuetree_raw(rdate, host, qindex, mtxrqueuetreename, mtxrqueuetreeflow, mtxrqueuetreeparentindex, mtxrqueuetreebytes, mtxrqueuetreepackets, mtxrqueuetreehcbytes, mtxrqueuetreepcqqueues)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + id + "', '" + processor.mtxrqueuetreename + "', '" + processor.mtxrqueuetreeflow + "', '" + processor.mtxrqueuetreeparentindex + "', '" + processor.mtxrqueuetreebytes + "', '" + processor.mtxrqueuetreepackets + "', '" + processor.mtxrqueuetreehcbytes + "', '" + processor.mtxrqueuetreepcqqueues + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    publisher(appConfig.amqp.mysqlqueuename, newMsg);
}

initLogger();
var logger = log4js.getLogger('nodeSNMPProcessor');
logger.info('Starting... ');

var open = require('amqplib').connect('amqp://' + appConfig.amqp.user + ':' + appConfig.amqp.password + '@' + appConfig.amqp.server);

open.then(function (conn) {
    return conn.createChannel();
}).then(function (ch) {
    return ch.assertQueue(appConfig.amqp.queuenamedata).then(function (ok) {
        return ch.consume(appConfig.amqp.queuenamedata, function (msg) {
            if (msg !== null) {
                strMsg = msg.content.toString();
                JSONPayload = JSON.parse(strMsg);

                switch (JSONPayload.service_name) {
                    case 'ifmib':
                        logger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
                        Object.keys(JSONPayload.data).forEach(function (key, index) {
                            var val = JSONPayload.data[key];
                            processifMIB(JSON.stringify(val), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name);
                        });
                        logger.debug('host ' + JSONPayload.host + ' rdate ' + JSONPayload.rdate + ' service_name ' + JSONPayload.service_name);
                        break;
                    case 'host_resources_processor':
                        logger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
                        Object.keys(JSONPayload.data).forEach(function (key, index) {
                            var val = JSONPayload.data[key];
                            processhost_resources_processor(JSON.stringify(val), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, index);
                        });
                        logger.debug('host ' + JSONPayload.host + ' rdate ' + JSONPayload.rdate + ' service_name ' + JSONPayload.service_name);
                        break;
                    case 'mikrotik_ap_client':
                        logger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
                        Object.keys(JSONPayload.data).forEach(function (key, index) {
                            var val = JSONPayload.data[key];
                            processmikrotik_ap_client(JSON.stringify(val), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, JSONPayload.ap_id);
                        });
                        logger.debug('host ' + JSONPayload.host + ' rdate ' + JSONPayload.rdate + ' service_name ' + JSONPayload.service_name);
                        break;

                    case 'mikrotik_queuetree':
                        logger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
                        Object.keys(JSONPayload.data).forEach(function (key, index) {
                            var val = JSONPayload.data[key];
                            logger.info('mikrotik_queuetree ' + JSON.stringify(val));
                            processmikrotik_queuetree(JSON.stringify(val), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, key);
                        });
                        logger.debug('host ' + JSONPayload.host + ' rdate ' + JSONPayload.rdate + ' service_name ' + JSONPayload.service_name);
                        break;
                    default:
                        logger.info('Unknown dataset -> ' + JSONPayload);
                }
                ch.ack(msg);
            }
        });
    });
}).catch(console.warn);