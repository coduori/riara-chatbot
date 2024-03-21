import { makeScopedLogger } from '../../../../utils/index.mjs';

const log = makeScopedLogger('http');

export const responseSender = (req, res, next) => {
    const rez = res;
    rez.respond = (status, message, data, metadata) => {
        const payload = { status };
        if (message) {
            payload.message = message;
        }
        if (data) {
            payload.data = data;
        }

        if (metadata) {
            payload.metadata = metadata;
        }
        return rez.status(status).send(payload);
    };
    next();
};

export const sendBadRequest = (res, message, exception = {}) => {
    if (exception.message) { log.error(exception); }
    return res.respond(400, message || exception.message || 'Bad request; check if all required fields were sent');
};

export const sendForbidden = (res, message) => res.respond(403, message || 'You are not allowed to perform the task.');

export const sendUnauthorized = (res, message) => res.respond(401, message || 'Unauthorized; Kindly check your credentials');

export const sendNotFound = (res, message) => res.respond(404, message || 'The requested resource was not found');

export const sendSuccess = (res, data, asyncProcessing, metadata) => res.respond(asyncProcessing ? 202 : 200, asyncProcessing ? 'Created' : 'OK', data, metadata);

export const sendServerError = (res, err, message = null) => {
    log.error(err);
    let data = null;
    if (process.env.NODE_ENV !== 'production') {
        data = err;
    }
    return res.respond(500, message || 'The application has encountered an unknown error. Help us improve your experience by sending an error report to info@icourage.co.ke', data);
};
