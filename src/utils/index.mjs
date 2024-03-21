import _ from 'lodash';
import path from 'path';
import config from 'config';
import morgan from 'morgan';
import signale from 'signale';
import process from 'process';
import { fileURLToPath } from 'url';
import { RateLimiterMemory } from 'rate-limiter-flexible';

export const ERROR_START = 15;

export const dateFormat = 'YYYY-MM-DD';

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

export const mongoObjectIdPattern = /^[0-9a-fA-F]{24}$/;

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

export function isEntryPoint(url) {
    const modulePath = fileURLToPath(url);

    const scriptPath = process.argv[1];
    const extension = path.extname(scriptPath);
    if (extension) {
        return modulePath === scriptPath;
    }

    return stripExt(modulePath) === scriptPath;
}

export const rateLimiter = () => {
    const options = {
        points: config.get('rateLimit.requests'),
        duration: config.get('rateLimit.durationInSeconds'),
    };
    const limiter = new RateLimiterMemory(options);
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        limiter.consume(ip)
            .then(() => { next(); })
            .catch(() => {
                log.warn(`Rate Limited: ${ip} for request ${req.method} ${req.originalUrl} with headers \n${JSON.stringify(req.headers, null, 2)}`);
                res.status(429).send({
                    status: 429,
                    message: 'Too many requests; Boss, slow down!',
                });
            });
    };
};
