import http from 'http';
import config from 'config';
import express from 'express';

import mongo from './utils/db/index.mjs';
import setupHttpServer from './http/index.mjs';

import {
    log,
    ERROR_START,
    isEntryPoint,
} from './utils/index.mjs';

let server;
const app = express();

app.start = async () => {
    log.info('Starting...');

    log.info('Initializing mongo connection...');
    await mongo.connect();

    const port = config.get('http.port');
    server = http.createServer(app);

    log.info('Setting up http...');
    await setupHttpServer({
        app,
        port,
        server,
    });

    server.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }
        log.error(`Failed to start server: ${error}`);
        process.exit(ERROR_START);
    });

    server.on('listening', async () => {
        const address = server.address();
        log.info(`Server listening ${address.address}:${address.port};`);
        log.info('Ready to GO!\n\n');
    });

    process.on('uncaughtException', (error) => {
        log.fatal(error);
    });

    process.on('unhandledRejection', (error) => {
        log.fatal(error);
    });

    log.info('Starting server...');
    server.listen(port);
};

app.stop = () => new Promise((resolve, reject) => {
    log.warn('Stopping server...');
    server.close(async (err) => {
        try {
            if (err) {
                reject(err);
                return;
            }
            await mongo.disconnect();
            log.info('Bye Bye!');
            resolve(true);
        } catch (ex) {
            reject(ex);
        }
    });
});

if (isEntryPoint(import.meta.url)) {
    Promise.resolve(true)
        .then(app.start)
        .catch(async (err) => {
            log.error(err);
            process.exit(ERROR_START);
        });
}

export default app;
