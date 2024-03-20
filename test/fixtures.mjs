import http from 'http';
import config from 'config';
import express from 'express';
import { Client as MinioClient } from 'minio';

import mongo from '../src/utils/db/index.mjs';
import { log, isEntryPoint } from '../src/utils/index.mjs';

export const logbookPdf = 'test/sample.pdf';
export const nationalIdPng = 'test/sampleImage.png';
export const nationalIdPdf = logbookPdf;
export const authToken = 'fakery';

export const customer = {
    email: 'grace@test.zr',
    firstName: 'Grace',
    lastName: 'Njihia',
    phoneNumber: '+254710000000',
    occupation: 'Teacher',
    nationalId: 'TH7871111',
    address: 'Xth, X Street, X Town',
    kraPin: 'A123456789A',
    gender: 'female',
};

export const application = {
    agent: 'some-unique-agent-identifier',
    issuer: 'email',
    duration: '30d', // or 1y or 2w
    coverStartDate: '2023-10-25T20:10:41.459Z',
    metadata: {
        payment: {
            provider: 'M-Pesa',
            transactionId: '86HYTGA555',
            amount: 'KES 783.88',
        },

        type: 'psvc',
        provider: 'britam',
        registration: `KCT${Math.floor(Math.random() * 900) + 100}L`,
        chasisNumber: `JIT123DFREW10${Math.floor(Math.random() * 900) + 100}`,
        engineNumber: 'CDE',
        bodyType: 'BT',
        make: 'Toyota',
        model: 'Hiace',
        yom: 1990,
        sumInsured: 2344,
        passengers: 3, // only needed for psv*
        isTaxi: false, // only needed for psv*
    },
    paymentMessage: 'RANDOMSTRING, Ksh.1000 sent to Incourage test as Payment for Insurance',
};

let mockServer;
export const setupMocks = () => {
    const app = express();

    // Auth API
    const { baseUrl, path } = config.get('auth');
    app.get(path, (req, res) => {
        res.json({ status: 200, data: { name: 'Bob Agent' } });
    });

    // Quotation API
    app.get(/^\/v1\/admin\/users/, (req, res) => {
        res.json({ status: 200, data: { name: 'Bob Agent' } });
    });

    // Payments API
    const { invoicePath } = config.get('payments');
    app.post(invoicePath, (req, res) => {
        res.json({ status: 200 });
    });

    mockServer = http.createServer(app);
    mockServer.listen(new URL(baseUrl).port);

    // TODO: Mock DMVIC/Directline responses
};

export const cleanUpMocks = (done) => mockServer.close(done);

const prepareMinioBuckets = async (minioClient, buckets) => {
    buckets.forEach(async (name) => {
        const bucket = config.get(`minio.buckets.${name}`);
        const alreadyCreated = await minioClient.bucketExists(bucket);
        if (!alreadyCreated) {
            await minioClient.makeBucket(bucket, 'us-east-1');
            await minioClient.setBucketPolicy(bucket, JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Sid: 'Public',
                    Effect: 'Allow',
                    Principal: { AWS: '*' },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucket}/*`],
                }],
            }));
        }
    });
};

// Hydrate DB
if (isEntryPoint(import.meta.url)) {
    Promise.resolve(true)
        .then(async () => {
            await mongo.connect();
            await mongo.truncate(true);

            await mongo.disconnect();
            const minioClient = new MinioClient(config.get('minio'));
            await prepareMinioBuckets(minioClient, Object.keys(config.get('minio.buckets')));
        })
        .catch(async (err) => {
            log.error(err);
            process.exit(1);
        });
}
