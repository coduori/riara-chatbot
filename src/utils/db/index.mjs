import config from 'config';
import mongoose from 'mongoose';

import grossWrittenPremiums from './grossWrittenPremiums.mjs';
import { makeScopedLogger } from '../index.mjs';

const log = makeScopedLogger('mongo');

async function connect() {
    log.info('Connecting...');
    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(config.get('database.mongo'));

    await grossWrittenPremiums.setDB(db);
}

async function disconnect() {
    log.info('Disconnecting...');
    return mongoose.disconnect();
}
async function truncate(force = false) {
    log.warn('Dangerous, removing everything from the db, HOPE YOU KNOW WHAT YOU\'RE DOING');
    if (force) {
        await grossWrittenPremiums.truncate();
    }
}

export default {
    connect,
    disconnect,
    truncate,

    grossWrittenPremiums,
};
