#!/usr/bin/env node

const log = require('yalm');
const Mqtt = require('mqtt');
const UrlPattern = require('url-pattern');
const fs = require('fs');
const config = require('./config.js');
const pkg = require('./package.json');

log.setLevel(config.verbosity);

log.info(pkg.name + ' ' + pkg.version + ' starting');

let mqttConnected;

const pattern = new UrlPattern(
    '(:protocol\\://:url\\::port)' +
    '(:protocol\\://:username\\::password\\@:url)' +
    '(:protocol\\://:username\\::password\\@:url\\::port)' +
    '(:protocol\\://:username\\::password\\@:ip.:ip.:ip.:ip)' +
    '(:protocol\\://:username\\::password\\@:ip.:ip.:ip.:ip\\::port)' +
    '(:protocol\\://:ip.:ip.:ip.:ip)' +
    '(:protocol\\://:ip.:ip.:ip.:ip\\::port)');

const brokerData = pattern.match(config.mqttUrl);

let options = {};

options['host'] = brokerData.url || brokerData.ip[0] + '.' + brokerData.ip[1] + '.' + brokerData.ip[2] + '.' + brokerData.ip[3];
options['protocol'] = brokerData.protocol || 'mqtt';

if (!(url.port)) {
    if (options['protocol'] === 'mqtt')
        options['port'] = 1880;
    else if (options['protocol'] === 'mqtts') {
        options['port'] = 8883;
    }
}

if (url.username && brokerData.password) {
    options['username'] = brokerData.username;
    options['password'] = brokerData.password;
}

options['rejectUnauthorized'] = !config.insecure;

if (config.trustedCa) {
    options['ca'] = fs.readFileSync(config.trustedCa);
}

if (config.clientKey && config.clientCert && config.trustedCa) {
    options['key'] = fs.readFileSync(config.clientKey);
    options['cert'] = fs.readFileSync(config.clientCert);
}

options['clientId'] = config.name + '_' + Math.random().toString(16).substr(2, 8);
options['will'] = {topic: config.name + '/connected', payload: '0', retain: true};

log.info(options);
log.info('mqtt trying to connect', options['host']);

const mqtt = Mqtt.connect(options);

function mqttPub(topic, payload, options) {
    log.debug('mqtt >', topic, payload);
    mqtt.publish(topic, payload, options);
}

mqtt.on('connect', () => {
    mqttConnected = true;

    log.info('mqtt connected', options['host']);
    mqttPub(config.name + '/connected', '1', {retain: true}); // TODO eventually set to '2' if target system already connected

    log.info('mqtt subscribe', config.name + '/set/#');
    mqtt.subscribe(config.name + '/set/#');
});

mqtt.on('close', () => {
    if (mqttConnected) {
        mqttConnected = false;
        log.info('mqtt closed ' + options['host']);
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
