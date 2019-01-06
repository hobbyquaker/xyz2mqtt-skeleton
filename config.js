module.exports = require('yargs')
    .env('XYZ2MQTT')
    .usage('Usage: $0 [options]')
    .describe('v', 'possible values: "error", "warn", "info", "debug"')
    .describe('n', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('u', 'mqtt broker url. May contain user/password and port')
    .describe('k', 'set path for client key')
    .describe('c', 'set path for client certificate')
    .describe('t', 'set path for trusted certification authority')
    .describe('h', 'show help')
    .boolean('insecure')
    .alias({
        c: 'clientCert',
        h: 'help',
        k: 'clientKey',
        n: 'name',
        t: 'trustedCa',
        u: 'mqttUrl',
        v: 'verbosity'
    })
    .default({
        n: 'xyz',  // TODO Replace Name here!
        u: 'mqtt://127.0.0.1',
        v: 'info'
    })
    .version()
    .help('help')
    .argv;
