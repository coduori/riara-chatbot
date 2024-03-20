import { readFileSync } from 'fs';
import { Client, FormData } from 'undici';
import { log } from './index.mjs';

// eslint-disable-next-line max-len
const invoke = async (method, baseUrl, path = undefined, additionalHeaders = {}, data = undefined, token = undefined, clientCertificate = null, retries = 5) => {
    let body = data;
    if (data) {
        if (!(data instanceof FormData)) {
            body = JSON.stringify(body);
            // eslint-disable-next-line no-param-reassign
            additionalHeaders['content-type'] = 'application/json';
        } else {
            // eslint-disable-next-line no-param-reassign
            additionalHeaders['content-type'] = 'multipart/form-data';
        }
    }

    let client = new Client(baseUrl);
    if (clientCertificate) {
        client = new Client(baseUrl, {
            connect: {
                key: readFileSync(clientCertificate.key, 'utf8'),
                cert: readFileSync(clientCertificate.cert, 'utf8'),
                requestCert: true,
                rejectUnauthorized: true,
            },
        });
    }

    let res;
    try {
        log.info(`Invoking ${method} request to ${baseUrl}${path}`);
        const headers = {
            authorization: token ? `Bearer ${token}` : undefined,
            accept: 'application/json',
            ...additionalHeaders,
        };
        log.info(`HEADERS: ${JSON.stringify(headers)}`);

        res = await client.request({
            path,
            method,
            body,
            headers,
        });
    } catch (error) {
        if (/Connect Timeout Error/.test(error.message)) {
            if (retries) {
                log.info('Time out error. Retrying...');
                return invoke(
                    method,
                    baseUrl,
                    path,
                    additionalHeaders,
                    data,
                    token,
                    clientCertificate,
                    retries - 1,
                );
            }
            throw new Error('Failed to make request after 5 attempts');
        } else {
            throw error;
        }
    }

    if (res.statusCode !== 200) {
        const rez = { error: `Failed to fetch data: ${res.statusCode}, ${await res.body.text()}` };

        return rez;
    }

    return /application\/json/.test(res.headers['content-type']) ? res.body.json() : res.body.text();
};

export default invoke;
