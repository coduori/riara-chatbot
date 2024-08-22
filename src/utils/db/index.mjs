import config from 'config';
import mongoose from 'mongoose';

import { makeScopedLogger } from '../index.mjs';
import courses from './courses.mjs';
import students from './students.mjs';
import units from './units.mjs';
import unitStatus from './unitStatus.mjs';
import timetables from './timetables.mjs';

const log = makeScopedLogger('mongo');

async function connect() {
    log.info('Connecting...');
    mongoose.set('strictQuery', false);
    const db = await mongoose.connect(config.get('database.mongo'));

    await courses.setDB(db);
    await students.setDB(db);
    await units.setDB(db);
    await unitStatus.setDB(db);
    await timetables.setDB(db);
}

async function disconnect() {
    log.info('Disconnecting...');
    return mongoose.disconnect();
}

export default {
    connect,
    disconnect,

    courses,
    students,
    units,
    unitStatus,
    timetables,
};
