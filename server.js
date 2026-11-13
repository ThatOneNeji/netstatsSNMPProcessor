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
 * @typedef {object} Target
 * @property {string} branch The name that will be used for the queue
 * @property {string} path The file path to scan for files
 * @property {string} filemask Regex pattern to use for selecting files
 * @property {integer} fileage How old the file needs to be before it is processed
 * @property {boolean} enabled This is to enable or disable the target
 * @description This object contains the configuration information for the target directories to scan
 */
/**
 * @typedef {object} Cron
 * @property {string} interval The cron interval to use for scanning the target directories
 * @property {string} timezone The timezone for the cron job
 * @description This object contains the configuration information for the cron job
 */
/**
 * @typedef {object} ApplicationConfiguration
 * @property {loggingConfiguration} logger This defines the way the logger works
 * @property {loggingOptions} logging This object contains the configuration information for the logging subsystem
 * @property {messageBrokerServerSettings} messagebrokers This object contains the configuration information for the message broker sub system
 * @property {queueBase} queues This object contains the queue information for the message broker subsystem
 * @property {Cron} cron This object contains the configuration information for the cron job
 * @property {array} targets This object contains the configuration information for the target directories to scan
 * @description Configuration from config.json
 */
/**
 * @property {ApplicationConfiguration} appConfig
 */
let appConfig;

/**
 * @property {string} cfgPath
 * @description This is the path to the configuration files
 */
const cfgPath = './configuration';

/**
 * @property {array} cfgFiles
 * @description This is the list of configuration files that are loaded during startup
 */
const cfgFiles = ['./configuration/logging.json', './configuration/messagebrokers.json'];

const snmpTypes = require('./definitions/types.json');

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
const os = require('os');
const hostname = os.hostname().split('.');

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
 * @function loadConfigurationFiles
 * @description Reads configuration from local file
 */
function loadConfigurationFiles() {
    if (fs.existsSync(cfgPath)) {
        for (const cfgFile of cfgFiles) {
            try {
                const cfgData = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
                if (cfgFile.includes('logging.json')) {
                    appConfig = Object.assign({}, appConfig, {logging: cfgData.logging, logger: cfgData.logger});
                } else if (cfgFile.includes('messagebrokers.json')) {
                    appConfig = Object.assign({}, appConfig, {messagebrokers: cfgData.messagebrokers, queues: cfgData.queues, credentials: cfgData.credentials});
                }
            } catch (err) {
                bail(err);
            }
        }
    } else {
        bail('The configuration directory does not exist(' + cfgPath + '), please create it and add the required configuration files');
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
        Object.keys(definitions.datasets).forEach(function (dataset) {
            if (overRideDataSets[dataset]) {
                Logging.system.debug('Override(s) found for dataset: ' + dataset);
                const tmpOverRide = overRideDataSets[dataset];
                if (Object.keys(tmpOverRide).length) {
                    const selectedDataset = loadedDataSets[dataset].objects;
                    Object.keys(tmpOverRide).forEach(function (override) {
                        const tmpObjOR = tmpOverRide[override];
                        Object.keys(tmpObjOR).forEach(function (obj) {
                            Object.keys(selectedDataset).forEach(function (selectedDatasetObj) {
                                if (tmpObjOR[obj].datatype) {
                                    oidTypeOverRides[obj] = tmpObjOR[obj].datatype;
                                }
                                if (selectedDataset[selectedDatasetObj][obj]) {
                                    const merged = {...selectedDataset[selectedDatasetObj][obj], ...tmpObjOR[obj]};
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
    loadConfigurationFiles();
    Logging = new Logger(appConfig.logging);
    Logging.system.info('Starting');
    loadDataSets();
    loadDefinitions();
    loadOverRides();
}

process.stdin.resume(); // so the program will not close instantly

/**
 *
 * @param {*} options
 * @param {*} exitCode
 * @description This function handles the exiting of the application
 */
function exitHandler(options, exitCode) {
    const msg = {
        signal: options.type,
        description: options.description,
        exitcode: exitCode
    };
    Logging.system.debug(msg);
    if (options.exit) {
        process.exit();
    }
}

// do something when app is closing
// process.on('exit', exitHandler.bind(null, { cleanup: true, type: 'ENDING', description: 'Application ending' }));
process.on('exit', (code) => {
    const msg = {cleanup: true, type: 'exit', code: code};
    Logging.system.debug('Application shut down: ' + JSON.stringify(msg));
});
// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true, type: 'SIGINT', description: 'SIGINT is generated by the user pressing Ctrl+C and is an interrupt'}));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit: true, type: 'SIGUSR1', description: 'The SIGUSR1 signal is sent to a process to indicate user-defined conditions'}));
process.on('SIGUSR2', exitHandler.bind(null, {exit: true, type: 'SIGUSR2', description: 'The SIGUSR2 signal is sent to a process to indicate user-defined conditions'}));
// catches uncaught exceptions
process.on('uncaughtException', (error) => {
    const msg = {
        exit: true,
        type: error.name,
        description: error.message,
        stack: error.stack
    };
    exitHandler.bind(null, msg);
    Logging.system.debug(msg);
    process.exit(1);
});

/**
 *
 * @description description
 */
function loadDataSets() {
    Logging.system.info('Loading definitions');
    Object.keys(snmpTypes).forEach(function (key) {
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
    Object.keys(definitions).forEach(function (key) {
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
    credentials: appConfig.credentials,
    receiveQueue: hostname[0] + '/' + appConfig.queues.consumeBaseName,
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
    return new Promise(function (resolve, _reject) {
        fdata.parsed = {
            sections: [],
            header: {}
        };
        fdata.sql = [];
        fdata.rawdata = loadFile(fdata.fullpath);
        resolve(fdata);
    }).then(function (_result) {
        Logging.parser.info('Routing to the "' + loadedDataSets[snmpTypes[fdata.header.type]].name + '" parser');
        return parsersnmp.parseSNMP(fdata, appConfig.queues.publishBaseName, loadedDataSets[snmpTypes[fdata.header.type]], definitions, Logging.parser, oidTypeOverRides);
    }).then(function (result) {
        if (result.sql.length) {
            Logging.messageclient.info('Sending ' + result.sql.length + ' item(s) to the message broker');
            messagebroker.batchPublish(result.sql);
        }
        return result;
    }).then(function (result) {
        removeSNMPFile(result.fullpath);
        return result;
    });
}
