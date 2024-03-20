import bodyParser from 'body-parser';
import compression from 'compression';

import api from './api/index.mjs';
import { log as logger, makeScopedLogger } from '../utils/index.mjs';

const log = makeScopedLogger('http');

export default async function setup({ app, port }) {
    app.set('port', port);

    if (process.env.NODE_ENV !== 'test') {
        app.use(logger.requestLogger);
    }

    app.use(compression());

    app.use(bodyParser.json({ limit: '16mb' }));
    app.use(bodyParser.urlencoded({
        extended: true,
    }));

    // Routes
    app.use(api);

    // 404
    app.use((req, res) => {
        res.status(404).send({ status: 404, message: 'The requested resource was not found' });
    });

    // The rest
    app.use((err, req, res, next) => { // eslint-disable-line
        log.error(err.stack);
        let message = process.env.NODE_ENV === 'production' ? 'Something went wrong, we\'re looking into it...' : err.stack;
        message = err.message || message;
        res.status(err.status || 500).send({ status: 500, message });
    });
}
