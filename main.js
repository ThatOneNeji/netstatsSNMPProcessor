var appConfig = require('./settings.json'), mibConfig = require('./mib.json');
var appQueue = require('./faQueue.js');
/* Libraries */
var log4js = require('log4js'), moment = require('moment'), amqp = require('amqplib');

/* Logging setup */
var genLogger = log4js.getLogger('General'), amqpLogger = log4js.getLogger('amqp'), snmpLogger = log4js.getLogger('snmp'), sqlLogger = log4js.getLogger('sql');
log4js.configure(appConfig.logger);

let queueSettings = {
    url: 'amqp://' + appConfig.amqp.user + ':' + appConfig.amqp.password + '@' + appConfig.amqp.server,
    consumeQueueName: appConfig.amqp.consumeQueueName,
    isWorkerEnabled: true
};
appQueue.init(log4js, queueSettings, processorHandler);

genLogger.info('Starting...');

function bail(err) {
    genLogger.error(err);
    process.exit(1);
}

function singlePublish(queuename, payload) {
//    //let str = JSON.parse(payload.data);
//    let str = Object.keys(payload.data).length;
////    JSON.parse()
//    console.log(payload);
    amqpLogger.debug('Sending payload to the queue broker, service: ' + JSON.stringify(payload.service));
    appQueue.publishMsg("", queuename, JSON.stringify(payload));
}


function batchPublish(queuename, payloads) {
//    amqpLogger.debug('Items: ' + payloads.length);
    payloads.forEach(function (payload) {
        //      amqpLogger.debug('Sending payload to the queue broker, service: ' + JSON.stringify(payload.service));
        appQueue.publishMsg("", queuename, JSON.stringify(payload));
    });
}

function processorHandler(msg) {
    let JSONPayload = JSON.parse(msg);
    switch (JSONPayload.service_name) {
        case 'ifmib_interfaces':
            let sqlData1 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
                let res = processifmib_interfaces(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name);
                if (res) {
                    sqlData1.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData1.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData1);
            //);
            break;
        case 'host_resources_processor':
            let sqlData2 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
                //              let val = JSONPayload.data[key];
                let res = processhost_resources_processor(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, index);
                if (res) {
                    sqlData2.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData2.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData2);
            break;

        case 'host_resources_storage':
            let sqlData3 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
                let res = processhost_resources_storage(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, index);
                if (res) {
                    sqlData3.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData3.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData3);
            break;

        case 'mikrotik_ap_client':
            let sqlData4 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
                let res = processmikrotik_ap_client(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, JSONPayload.ap_id);
                if (res) {
                    sqlData4.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData4.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData4);
            break;

        case 'mikrotik_queuetree':
            let sqlData5 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
//                let res = processmikrotik_queuetree(JSON.stringify(val), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, key);
//                let val = JSONPayload.data[key];
                let res = processmikrotik_queuetree(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, key);
                if (res) {
                    sqlData5.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData5.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData5);
            break;

        case 'mikrotik_interfacestats':
            let sqlData6 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
                //    amqpLogger.info('mikrotik_interfacestats ' + JSON.stringify(val));
                let res = processmikrotik_interfacestats(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, key);
                if (res) {
                    sqlData6.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData6.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData6);
            break;

        case 'ifhcmib_interfaces':
            let sqlData7 = [];
            amqpLogger.debug('Parsing "' + JSONPayload.service_name + '" data for ' + JSONPayload.host);
            Object.keys(JSONPayload.data).forEach(function (key, index) {
//                let val = JSONPayload.data[key];
                let res = processifhcmib_interfaces(JSON.stringify(JSONPayload.data[key]), JSONPayload.host, JSONPayload.rdate, JSONPayload.service_name, key);
                if (res) {
                    sqlData7.push(res);
                }
            });
            amqpLogger.info('host: ' + JSONPayload.host + ' rdate: ' + JSONPayload.rdate + ' service_name: ' + JSONPayload.service_name + ' items: ' + sqlData7.length);
            batchPublish(appConfig.amqp.publishQueueName, sqlData7);
            break;
        default:
            amqpLogger.warn('Unknown dataset -> ' + JSON.stringify(JSONPayload));
    }
}

function ifNull(value) {
    if (value == null) {
        return '0';
    }
    return value;
}

function processifmib_interfaces(snmpdata, host, rdate, servicename) {
    //  sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    interface = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_ifmib_raw(RDate, host, ifIndex, ifDescr, ifType, ifMtu, ifSpeed, ifPhysAddress, ifAdminStatus, ifOperStatus, ifLastChange, ifInOctets, ifInUcastPkts, ifInNUcastPkts, ifInDiscards, ifInErrors, ifInUnknownProtos, ifOutOctets, ifOutUcastPkts, ifOutNUcastPkts, ifOutDiscards, ifOutErrors, ifOutQLen, ifSpecific)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + ifNull(interface.ifindex) + "', '" + ifNull(interface.ifdescr) + "', '" + ifNull(interface.iftype) + "', '" + ifNull(interface.ifmtu) + "', '" + ifNull(interface.ifspeed) + "', '" + ifNull(interface.ifphysaddress) + "', '" + ifNull(interface.ifadminstatus) + "', '" + ifNull(interface.ifoperstatus) + "', '" + ifNull(interface.iflastchange) + "', '" + ifNull(interface.ifinoctets) + "', '" + ifNull(interface.ifinucastpkts) + "', '" + ifNull(interface.ifinnucastpkts) + "', '" + ifNull(interface.ifindiscards) + "', '" + ifNull(interface.ifinerrors) + "', '" + ifNull(interface.ifinunknownprotos) + "', '" + ifNull(interface.ifoutoctets) + "', '" + ifNull(interface.ifoutucastpkts) + "', '" + ifNull(interface.ifoutnucastpkts) + "', '" + ifNull(interface.ifoutdiscards) + "', '" + ifNull(interface.ifouterrors) + "', '" + ifNull(interface.ifoutqlen) + "', '" + ifNull(interface.ifspecific) + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'n' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function processifhcmib_interfaces(snmpdata, host, rdate, servicename, id) {
    //   sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    hcinterface = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_ifhcmib_raw(RDate, host, ifIndex, ifname, ifinmulticastpkts, ifinbroadcastpkts, ifoutmulticastpkts, ifoutbroadcastpkts, ifhcinoctets, ifhcinucastpkts, ifhcinmulticastpkts, ifhcinbroadcastpkts, ifhcoutoctets, ifhcoutucastpkts, ifhcoutmulticastpkts, ifhcoutbroadcastpkts, iflinkupdowntrapenable, ifhighspeed, ifpromiscuousmode, ifconnectorpresent, ifalias, ifcounterdiscontinuitytime)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + id + "', '" + hcinterface.ifname + "', '" + ifNull(hcinterface.ifinmulticastpkts) + "', '" + ifNull(hcinterface.ifinbroadcastpkts) + "', '" + ifNull(hcinterface.ifoutmulticastpkts) + "', '" + ifNull(hcinterface.ifoutbroadcastpkts) + "', '" + ifNull(hcinterface.ifhcinoctets) + "', '" + ifNull(hcinterface.ifhcinucastpkts) + "', '" + ifNull(hcinterface.ifhcinmulticastpkts) + "', '" + ifNull(hcinterface.ifhcinbroadcastpkts) + "', '" + ifNull(hcinterface.ifhcoutoctets) + "', '" + ifNull(hcinterface.ifhcoutucastpkts) + "', '" + ifNull(hcinterface.ifhcoutmulticastpkts) + "', '" + ifNull(hcinterface.ifhcoutbroadcastpkts) + "', '" + ifNull(hcinterface.iflinkupdowntrapenable) + "', '" + ifNull(hcinterface.ifhighspeed) + "', '" + ifNull(hcinterface.ifpromiscuousmode) + "', '" + ifNull(hcinterface.ifconnectorpresent) + "', '" + ifNull(hcinterface.ifalias) + "', '" + ifNull(hcinterface.ifcounterdiscontinuitytime) + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'n' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function processhost_resources_processor(snmpdata, host, rdate, servicename, id) {
    //  sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_host_resources_processor_raw(RDate, host, hrprocessorfrwid, hrprocessorload)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + id + "', '" + processor.hrprocessorload + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function processhost_resources_storage(snmpdata, host, rdate, servicename, id) {
    //  sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    storage = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_host_resources_storage_raw(RDate, host, hrstorageindex, hrstoragetype, hrstoragedescr, hrstorageallocationunits, hrstoragesize, hrstorageused, hrstorageallocationfailures)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + storage.hrstorageindex + "', '" + storage.hrstoragetype + "', '" + storage.hrstoragedescr + "', '" + storage.hrstorageallocationunits + "', '" + storage.hrstoragesize + "', '" + storage.hrstorageused + "', '" + storage.hrstorageallocationfailures + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function makeMacAddr(mac_add_raw) {
    var str = mac_add_raw;
    var res = str.match(/.{1,2}/g);
    var rrr = res[0].toUpperCase() + ':' + res[1].toUpperCase() + ':' + res[2].toUpperCase() + ':' + res[3].toUpperCase() + ':' + res[4].toUpperCase() + ':' + res[5].toUpperCase();
    return rrr;
}

function processmikrotik_ap_client(snmpdata, host, rdate, servicename, id) {
    //  sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    makeMacAddr(processor.mtxrwlrtabaddr);
    sqlFields = "INSERT INTO tbl_base_snmp_mikrotik_ap_client_raw(RDate, host, mtxrwlrtabaddr, mtxrwlrtabiface, mtxrwlrtabstrength, mtxrwlrtabtxbytes, mtxrwlrtabrxbytes, mtxrwlrtabtxpackets, mtxrwlrtabrxpackets, mtxrwlrtabtxrate, mtxrwlrtabrxrate, mtxrwlrtabrouterosversion, mtxrwlrtabuptime, mtxrwlrtabsignaltonoise, mtxrwlrtabtxstrengthch0, mtxrwlrtabrxstrengthch0, mtxrwlrtabtxstrengthch1, mtxrwlrtabrxstrengthch1, mtxrwlrtabtxstrengthch2, mtxrwlrtabrxstrengthch2, mtxrwlrtabtxstrength)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + makeMacAddr(processor.mtxrwlrtabaddr) + "', '" + id + "', '" + processor.mtxrwlrtabstrength + "', '" + processor.mtxrwlrtabtxbytes + "', '" + processor.mtxrwlrtabrxbytes + "', '" + processor.mtxrwlrtabtxpackets + "', '" + processor.mtxrwlrtabrxpackets + "', '" + processor.mtxrwlrtabtxrate + "', '" + processor.mtxrwlrtabrxrate + "', '" + processor.mtxrwlrtabrouterosversion + "', '" + processor.mtxrwlrtabuptime + "', '" + processor.mtxrwlrtabsignaltonoise + "', '" + processor.mtxrwlrtabtxstrengthch0 + "', '" + processor.mtxrwlrtabrxstrengthch0 + "', '" + processor.mtxrwlrtabtxstrengthch1 + "', '" + processor.mtxrwlrtabrxstrengthch1 + "', '" + processor.mtxrwlrtabtxstrengthch2 + "', '" + processor.mtxrwlrtabrxstrengthch2 + "', '" + processor.mtxrwlrtabtxstrength + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' and ldate = now();";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function processmikrotik_queuetree(snmpdata, host, rdate, servicename, id) {
    //  sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    processor = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_mikrotik_queuetree_raw(rdate, host, qindex, mtxrqueuetreename, mtxrqueuetreeflow, mtxrqueuetreeparentindex, mtxrqueuetreebytes, mtxrqueuetreepackets, mtxrqueuetreehcbytes, mtxrqueuetreepcqqueues)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + id + "', '" + processor.mtxrqueuetreename + "', '" + processor.mtxrqueuetreeflow + "', '" + processor.mtxrqueuetreeparentindex + "', '" + processor.mtxrqueuetreebytes + "', '" + processor.mtxrqueuetreepackets + "', '" + processor.mtxrqueuetreehcbytes + "', '" + processor.mtxrqueuetreepcqqueues + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}

function processmikrotik_interfacestats(snmpdata, host, rdate, servicename, id) {
    //   sqlLogger.debug('Processing ' + servicename + ' data for ' + host);
    newMsg = {};
    newMsg.service = servicename;
    interfacestats = JSON.parse(snmpdata);
    sqlFields = "INSERT INTO tbl_base_snmp_mikrotikinterfacestats_raw(rdate, host, mtxrinterfacestatsindex, mtxrinterfacestatsname, mtxrinterfacestatsdriverrxbytes, mtxrinterfacestatsdriverrxpackets, mtxrinterfacestatsdrivertxbytes, mtxrinterfacestatsdrivertxpackets, mtxrinterfacestatstxrx64, mtxrinterfacestatstxrx65to127, mtxrinterfacestatstxrx128to255, mtxrinterfacestatstxrx256to511, mtxrinterfacestatstxrx512to1023, mtxrinterfacestatstxrx1024to1518, mtxrinterfacestatstxrx1519tomax, mtxrinterfacestatsrxbytes, mtxrinterfacestatsrxpackets, mtxrinterfacestatsrxtooshort, mtxrinterfacestatsrx64, mtxrinterfacestatsrx65to127, mtxrinterfacestatsrx128to255, mtxrinterfacestatsrx256to511, mtxrinterfacestatsrx512to1023, mtxrinterfacestatsrx1024to1518, mtxrinterfacestatsrx1519tomax, mtxrinterfacestatsrxtoolong, mtxrinterfacestatsrxbroadcast, mtxrinterfacestatsrxpause, mtxrinterfacestatsrxmulticast, mtxrinterfacestatsrxfcserror, mtxrinterfacestatsrxalignerror, mtxrinterfacestatsrxfragment, mtxrinterfacestatsrxoverflow, mtxrinterfacestatsrxcontrol, mtxrinterfacestatsrxunknownop, mtxrinterfacestatsrxlengtherror, mtxrinterfacestatsrxcodeerror, mtxrinterfacestatsrxcarriererror, mtxrinterfacestatsrxjabber, mtxrinterfacestatsrxdrop, mtxrinterfacestatstxbytes, mtxrinterfacestatstxpackets, mtxrinterfacestatstxtooshort, mtxrinterfacestatstx64, mtxrinterfacestatstx65to127, mtxrinterfacestatstx128to255, mtxrinterfacestatstx256to511, mtxrinterfacestatstx512to1023, mtxrinterfacestatstx1024to1518, mtxrinterfacestatstx1519tomax, mtxrinterfacestatstxtoolong, mtxrinterfacestatstxbroadcast, mtxrinterfacestatstxpause, mtxrinterfacestatstxmulticast, mtxrinterfacestatstxunderrun, mtxrinterfacestatstxcollision, mtxrinterfacestatstxexcessivecollision, mtxrinterfacestatstxmultiplecollision, mtxrinterfacestatstxsinglecollision, mtxrinterfacestatstxexcessivedeferred, mtxrinterfacestatstxdeferred, mtxrinterfacestatstxlatecollision, mtxrinterfacestatstxtotalcollision, mtxrinterfacestatstxpausehonored, mtxrinterfacestatstxdrop, mtxrinterfacestatstxjabber, mtxrinterfacestatstxfcserror, mtxrinterfacestatstxcontrol, mtxrinterfacestatstxfragment)";
    sqlValues = "values ('" + rdate + "', '" + host + "', '" + interfacestats.mtxrinterfacestatsindex + "', '" + interfacestats.mtxrinterfacestatsname + "', '" + ifNull(interfacestats.mtxrinterfacestatsdriverrxbytes) + "', '" + ifNull(interfacestats.mtxrinterfacestatsdriverrxpackets) + "', '" + ifNull(interfacestats.mtxrinterfacestatsdrivertxbytes) + "', '" + ifNull(interfacestats.mtxrinterfacestatsdrivertxpackets) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx64) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx65to127) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx128to255) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx256to511) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx512to1023) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx1024to1518) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxrx1519tomax) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxbytes) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxpackets) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxtooshort) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx64) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx65to127) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx128to255) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx256to511) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx512to1023) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx1024to1518) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrx1519tomax) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxtoolong) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxbroadcast) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxpause) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxmulticast) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxfcserror) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxalignerror) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxfragment) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxoverflow) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxcontrol) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxunknownop) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxlengtherror) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxcodeerror) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxcarriererror) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxjabber) + "', '" + ifNull(interfacestats.mtxrinterfacestatsrxdrop) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxbytes) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxpackets) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxtooshort) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx64) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx65to127) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx128to255) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx256to511) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx512to1023) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx1024to1518) + "', '" + ifNull(interfacestats.mtxrinterfacestatstx1519tomax) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxtoolong) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxbroadcast) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxpause) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxmulticast) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxunderrun) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxcollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxexcessivecollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxmultiplecollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxsinglecollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxexcessivedeferred) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxdeferred) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxlatecollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxtotalcollision) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxpausehonored) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxdrop) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxjabber) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxfcserror) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxcontrol) + "', '" + ifNull(interfacestats.mtxrinterfacestatstxfragment) + "') ";
    sqlDuplicate = " ON DUPLICATE KEY UPDATE processed = 'u' ;";
    newMsg.sql = sqlFields + sqlValues + sqlDuplicate;
    return newMsg;
//    singlePublish(appConfig.amqp.publishQueueName, newMsg);
}
