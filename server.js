/**
 * @typedef {Object} queueBase
 * @property {string} consumeBaseName This is the base queue name to use for consume
 * @property {string} publishBaseName This is the base queue name to use for publish
 * @description This object contains the queue information for the message broker subsystem
 */
/**
 * @typedef {Object} loggingConfiguration
 * @property {string} appenders Appenders serialise log events to some form of output
 * @property {string} categories The category (or categories if you provide an array of values) that will be excluded from the appender.
 * @description This defines the way the logger works
 */
/**
 * @typedef {Object} loggingOptions
 * @property {string} level The level of logging to use
 * @property {array} areas This is the various areas used for getLogger
 * @property {string} owner Application name
 * @description This object contains the configuration information for the logging subsystem
 */
/**
 * @typedef {object} ApplicationConfiguration
 * @property {loggingConfiguration} logger This defines the way the logger works
 * @property {loggingOptions} logging This object contains the configuration information for the logging subsystem
 * @property {messageBrokerServerSettings} messagebrokers This object contains the configuration information for the message broker sub system
 * @property {queueBase} queues This object contains the queue information for the message broker subsystem
 * @description Configuration from config.json
 */
/**
 * @property {ApplicationConfiguration} appConfig
 */
let appConfig;


const snmpTypes = require('./parsers/types.json');

/**
 * @function parsersnmp
 * @description description
 */
const parsersnmp = require('./parsers/parsesnmp.js');

/* Load internal libraries */
/**
 * @function logging
 * @description  description
 */
const Logger = require('commonfunctions').Logger;

/**
 * @function MessageBroker
 * @description Message broker sub system
 */
const MessageBroker = require('commonfunctions').MessageBroker;
const messagebroker = new MessageBroker();


/* 3rd party libraries */
const fs = require('fs');

/* Global vars */
let Logging;

const loadedDataSets = {};
let overRideDataSets = {};
const oidTypeOverRides = {};
const definitions = {
    datasets: {},
    datatypes: {},
    intervals: {},
    tables: {},
    overrides: {
        oid_lookups: {},
        counters: {}
    }
};

/**
 * @function bail
 * @param {*} err String/object from sender
 * @description We use this to exit out of the application if fatal
 */
function bail(err) {
    console.error(err);
    process.exit(1);
}

/**
 * @function loadConfigurationFile
 * @description Reads configuration from local file
 */
function loadConfigurationFile() {
    try {
        appConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch (err) {
        bail(err);
    }
}

/**
 *
 * @description Loads the definitions from the various files
 */
function loadOverRides() {
    Logging.system.info('Loading overrides');
    try {
        overRideDataSets = definitions.overrides.counters;
        Object.keys(definitions.datasets).forEach(function(dataset) {
            if (overRideDataSets[dataset]) {
                Logging.system.debug('Override(s) found for dataset: ' + dataset);
                const tmpOverRide = overRideDataSets[dataset];
                if (Object.keys(tmpOverRide).length) {
                    const selectedDataset = loadedDataSets[dataset].objects;
                    Object.keys(tmpOverRide).forEach(function(override) {
                        const tmpObjOR = tmpOverRide[override];
                        Object.keys(tmpObjOR).forEach(function(obj) {
                            Object.keys(selectedDataset).forEach(function(selectedDatasetObj) {
                                if (tmpObjOR[obj].datatype) {
                                    oidTypeOverRides[obj] = tmpObjOR[obj].datatype;
                                }
                                if (selectedDataset[selectedDatasetObj][obj]) {
                                    const merged = {...selectedDataset[selectedDatasetObj][obj], ...tmpObjOR[obj] };
                                    selectedDataset[selectedDatasetObj][obj] = merged;
                                }
                            });
                        });
                    });
                }
            }
        });
    } catch (err) {
        bail(err);
    }
}

/**
 * @function initialiseApplication
 * @description Starts up the application
 */
function initialiseApplication() {
    loadConfigurationFile();
    Logging = new Logger(appConfig.logging);
    Logging.system.info('Starting');
    loadDataSets();
    loadDefinitions();
    loadOverRides();
}

/**
 *
 * @description description
 */
function loadDataSets() {
    Logging.system.info('Loading definitions');
    Object.keys(snmpTypes).forEach(function(key) {
        Logging.system.info(snmpTypes[key]);
        try {
            Logging.system.info('Reading "' + snmpTypes[key] + '" file from disk');
            const tempDef = fs.readFileSync('./datasets/' + snmpTypes[key] + '.json', 'utf8');
            try {
                Logging.system.debug('Testing "' + snmpTypes[key] + '"');
                loadedDataSets[snmpTypes[key]] = JSON.parse(tempDef);
                Logging.system.debug('Definition "' + snmpTypes[key] + '" seems to check out');
            } catch (err) {
                bail(err);
            }
        } catch (err) {
            bail(err);
        }
    });
}

/**
 * @function loadDefinitions
 * @description Loads the definitions from the various files
 */
function loadDefinitions() {
    Logging.system.info('Loading definitions');
    Object.keys(definitions).forEach(function(key) {
        Logging.system.info(key);
        try {
            Logging.system.info('Reading "' + key + '" file from disk');
            const tempDef = fs.readFileSync('./definitions/' + key + '.json', 'utf8');
            try {
                Logging.system.debug('Testing "' + key + '"');
                definitions[key] = JSON.parse(tempDef);
                Logging.system.debug('Definition "' + key + '" seems to check out');
            } catch (err) {
                bail(err);
            }
        } catch (err) {
            bail(err);
        }
    });
}

/**
 * Initialise the application
 */
initialiseApplication();


/**
 * @typedef {Object} messageBrokerServerSettings
 * @property {string} host Host name or address to use
 * @property {string} user Username to use
 * @property {string} password Pasword for above listed username
 * @property {string} port Port for host (optional)
 * @property {string} vhost The vhost to use (optional)
 * @property {string} active If this host should be used or not (optional)
 * @description This object contains the configuration information for the message broker sub system
 */
/**
 * @typedef {Object} messageBrokerOptions
 * @property {function} logger Logger to pass on to the messagebroker so that it can log messages
 * @property {messageBrokerServerSettings} config Configuration for the RabbitMQ server
 * @property {string} receiveQueue This is the queue to consume from
 * @property {string} receiveQueueName This is the name of the consume instance
 * @property {function} externalHandover This function is called from the message broker in order to action incoming data
 */
const messageBrokerOptions = {
    logger: Logging.messagebroker,
    config: appConfig.messagebrokers,
    receiveQueue: appConfig.queues.consumeBaseName,
    publishQueueName: appConfig.queues.publishBaseName,
    externalHandover: receiveHandler
};

/**
 * Start the message broker sub system
 */
messagebroker.init(messageBrokerOptions);

Logging.system.info('Starting...');


/**
 *
 * @param {*} msg
 * @return {*}
 * @description description
 */
function receiveHandler(msg) {
    const JSONPayload = JSON.parse(msg.content.toString());
    if (JSONPayload.filename) {
        Logging.messageclient.info('Now processing "' + JSONPayload.filename + '"');
        if (fs.existsSync(JSONPayload.fullpath)) {
            const snmpFileStat = fs.statSync(JSONPayload.fullpath);
            if (snmpTypes[JSONPayload.header.type]) {
                if (snmpFileStat.size) {
                    removeSNMPFile(JSONPayload.fullpath, readSNMPFile(JSONPayload));
                } else {
                    Logging.fs.debug('"' + JSONPayload.fullpath + '" is zero size');
                    removeSNMPFile(JSONPayload.fullpath, true);
                }
            } else {
                Logging.parser.debug('No config loaded for type "' + JSONPayload.header.type + '"(' + JSONPayload.filename + ')');
                removeSNMPFile(JSONPayload.fullpath);
            }
        } else {
            Logging.fs.debug('"' + JSONPayload.fullpath + '" does not seem to exist');
            removeSNMPFile(JSONPayload.fullpath);
        }
    } else {
        Logging.messageclient.debug('Unknown msg structure');
    }
    return true;
}

/**
 *
 * @param {*} fullpath
 * @param {*} cleanup
 * @return {*}
 * @description description
 */
function removeSNMPFile(fullpath, cleanup = false) {
    Logging.fs.info('Removing "' + fullpath + '"');
    if (cleanup) {
        fs.unlink(fullpath, (err) => {
            if (err) {
                Logging.fs.error(err);
                throw err;
            }
            Logging.fs.debug('File "' + fullpath + '" is gone.');
        });
    }
    return true;
}
// No Such Instance currently exists at this OID
// No Such Object available on this agent at this OID
// No more variables left in this MIB View (It is past the end of the MIB tree)
/**
 *
 * @param {*} fileName
 * @return {*}
 * @description description
 */
function loadFile(fileName) {
    return fs.readFileSync(fileName, 'utf8');
}

/**
 *
 * @param {*} fdata
 * @return {*}
 * @description description
 */
function readSNMPFile(fdata) {
    return new Promise(function(resolve, _reject) {
        fdata.parsed = {
            sections: [],
            header: {}
        };
        fdata.sql = [];
        fdata.rawdata = loadFile(fdata.fullpath);
        resolve(fdata);
    }).then(function(_result) {
        Logging.parser.info('Routing to the "' + loadedDataSets[snmpTypes[fdata.header.type]].name + '" parser');
        return parsersnmp.parseSNMP(fdata, appConfig.queues.publishBaseName, loadedDataSets[snmpTypes[fdata.header.type]], definitions, Logging.parser, oidTypeOverRides);
    }).then(function(result) {
        if (result.sql.length) {
            Logging.messageclient.info('Sending ' + result.sql.length + ' item(s) to the message broker');
            messagebroker.batchPublish(result.sql);
        }
        return result;
    }).then(function(result) {
        removeSNMPFile(result.fullpath);
        return result;
    });
}