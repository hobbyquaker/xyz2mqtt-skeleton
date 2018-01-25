module.exports = require('yargs')
    .usage('Usage: $0 [options]')
    .describe('v', 'possible values: "error", "warn", "info", "debug"')
    .describe('n', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('u', 'mqtt broker url')
    .describe('h', 'show help')
    .alias({
        h: 'help',
        n: 'name',
        u: 'url',
        v: 'verbosity'
    })
    .default({
        u: 'mqtt://127.0.0.1',
        n: 'xyz',  // TODO Replace Name here!
        v: 'info'
    })
    .version()
    .help('help')
    .argv;
