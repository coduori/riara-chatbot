import _ from 'lodash';
import path from 'path';
import morgan from 'morgan';
import signale from 'signale';
import process from 'process';
import { fileURLToPath } from 'url';

export const ERROR_START = 15;

export const dateFormat = 'YYYY-MM-DD';

export const policyStatusTypes = ['active', 'expired'];

export const renewalInsuranceTypes = ['torc', 'torp', 'psvmttpo'];

export const clientDetailsDocumentOptions = ['logbook', 'krapin'];

export const log = (() => {
    const opts = {
        interactive: false,
    };
    const logger = new signale.Signale(opts);

    logger.requestLogger = morgan('dev');

    return logger;
})();

export const makeScopedLogger = (scope) => {
    const logger = log.scope(scope);
    return logger;
};

export const isEmpty = (value) => {
    if (typeof value === 'number') return false;

    let val = value;
    if (typeof value === 'string') {
        val = value.trim();
    }
    return _.isEmpty(val);
};

export const randomNumber = (min, max) => Math.floor(Math.random() * (max - (min + 1))) + min;

export const delay = (time) => new Promise((resolve) => { setTimeout(() => resolve(), time); });

export const makeBasicHTTPAuthValue = (username, password) => `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

export function stripExt(name) {
    const extension = path.extname(name);
    if (!extension) {
        return name;
    }

    return name.slice(0, -extension.length);
}

export const getExt = (name) => {
    const items = name.split('/');
    const filename = items[items.length - 1];
    const parts = filename.split('.');
    const ext = parts[parts.length - 1];
    return ext;
};

export function isEntryPoint(url) {
    const modulePath = fileURLToPath(url);

    const scriptPath = process.argv[1];
    const extension = path.extname(scriptPath);
    if (extension) {
        return modulePath === scriptPath;
    }

    return stripExt(modulePath) === scriptPath;
}
