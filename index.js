#!/usr/bin/env node

const fs = require('fs');
const log = require('yalm');
const Mqtt = require('mqtt');
const UrlPattern = require('url-pattern');
const config = require('./config.js');
const pkg = require('./package.json');

log.setLevel(config.verbosity);

log.info(pkg.name + ' ' + pkg.version + ' starting');

let mqttConnected;

const pattern = new UrlPattern(
    '(:protocol\\://:url)' +
    '(:protocol\\://:url\\::port)' +
    '(:protocol\\://:username\\::password\\@:url)' +
    '(:protocol\\://:username\\::password\\@:url\\::port)' +
    '(:protocol\\://:username\\::password\\@:ip.:ip.:ip.:ip)' +
    '(:protocol\\://:username\\::password\\@:ip.:ip.:ip.:ip\\::port)' +
    '(:protocol\\://:ip.:ip.:ip.:ip)' +
    '(:protocol\\://:ip.:ip.:ip.:ip\\::port)');

const brokerData = pattern.match(config.mqttUrl);

let mqttOptions = {};

mqttOptions['host'] = brokerData.url || brokerData.ip[0] + '.' + brokerData.ip[1] + '.' + brokerData.ip[2] + '.' + brokerData.ip[3];
mqttOptions['protocol'] = brokerData.protocol || 'mqtt';

if (!(brokerData.port)) {
    if (mqttOptions['protocol'] === 'mqtt') {
        mqttOptions['port'] = 1883;
    }
    else if (mqttOptions['protocol'] === 'mqtts') {
        mqttOptions['port'] = 8883;
    }
} else {
    mqttOptions['port'] = brokerData.port;
}

if (brokerData.username && brokerData.password) {
    mqttOptions['username'] = brokerData.username;
    mqttOptions['password'] = brokerData.password;
}

if (config.trustedCa) {
    mqttOptions['ca'] = fs.readFileSync(config.trustedCa);
    mqttOptions['rejectUnauthorized'] = !config.insecure;
}

if (config.clientKey && config.clientCert && config.trustedCa) {
    mqttOptions['key'] = fs.readFileSync(config.clientKey);
    mqttOptions['cert'] = fs.readFileSync(config.clientCert);
}

mqttOptions['clientId'] = config.name + '_' + Math.random().toString(16).substr(2, 8);
mqttOptions['will'] = {topic: config.name + '/connected', payload: '0', retain: true};

log.debug(mqttOptions);
log.info('mqtt trying to connect', mqttOptions['host']);

const mqtt = Mqtt.connect(mqttOptions);

function mqttPub(topic, payload, options) {
    log.debug('mqtt >', topic, payload);
    mqtt.publish(topic, payload, options);
}

mqtt.on('connect', () => {
    mqttConnected = true;

    log.info('mqtt connected', mqttOptions['host']);
    mqttPub(config.name + '/connected', '1', {retain: true}); // TODO eventually set to '2' if target system already connected

    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', () => {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + mqttOptions['host']);
    }
});

mqtt.on('error', err => {
    log.error('mqtt', err);
});

mqtt.on('message', (topic, payload) => {
    payload = payload.toString();
    log.debug('mqtt <', topic, payload);
    // TODO do something with incoming messages
});
