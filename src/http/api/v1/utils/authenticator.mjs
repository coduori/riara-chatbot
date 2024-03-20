import config from 'config';
import { unless } from 'express-unless';

import invoke from '../../../../utils/http.mjs';
import { log } from '../../../../utils/index.mjs';

export const getToken = (req) => {
    try {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
            const scheme = parts[0];
            const token = parts[1];
            if (/^Bearer$/i.test(scheme)) {
                return token;
            }
        }
    } catch (ex) { /* ignore */ }
    return null;
};

const authenticate = async (req, res, next) => {
    const token = getToken(req);
    if (!token) {
        res.status(401).send({ status: 401, message: 'Unauthorized; check your token' });
        return;
    }

    try {
        const { baseUrl, paths } = config.get('internalServices.quotation');
        const user = await invoke('GET', baseUrl, paths.getUser, {}, undefined, token);
        const { status = 200, message, data } = user;
        if (status !== 200) {
            throw new Error(message);
        }
        req.user = data;
        req.token = token;
        next();
    } catch (ex) {
        log.error(ex);
        res.status(401).send({ status: 401, message: ex.message });
    }
};

authenticate.unless = unless;

export default [
    authenticate
        .unless({}),
];
