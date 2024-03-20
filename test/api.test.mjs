/* global expect, beforeAll, afterAll */
import path from 'path';
import request from 'supertest';

import app from '../src/app.mjs';

import {
    customer,
    authToken,
    logbookPdf,
    setupMocks,
    application,
    cleanUpMocks,
    nationalIdPdf,
    nationalIdPng,
} from './fixtures.mjs';

describe('API', () => {
    const baseUrl = '/v1';
    let policyId;
    let customerId;
    let customerEmail;
    let customerPhone;
    let applicationId;
    let documentFile;
    let corporateCustomerId;
    const policyNumber = 'bac';

    beforeAll(async () => {
        await setupMocks();
        await app.start();
    });

    afterAll((done) => {
        app.stop()
            .then(cleanUpMocks(done))
            .catch(done);
    });

    describe('Customers', () => {
        test('Creates a customer', (done) => {
            request(app)
                .post(`${baseUrl}/customers`)
                .set('authorization', `Bearer ${authToken}`)
                .send(customer)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    customerId = res.body.data.id;
                    customerEmail = res.body.data.email;
                    customerPhone = res.body.data.phoneNumber;

                    request(app)
                        .post(`${baseUrl}/customers`)
                        .set('authorization', `Bearer ${authToken}`)
                        .send(customer)
                        .expect(400)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(400);
                            expect(re.body.message).toEqual('An entry with {"phoneNumber":"+254710000000"} already exists');
                            done();
                        });
                });
        });

        test('Creates a corporate customer and uploads business certificate', (done) => {
            request(app)
                .post(`${baseUrl}/customers`)
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    corporateName: 'INCOURAGE',
                    contactPersonDesignation: 'caretaker',
                    contactPersonName: 'Alfred',
                    email: 'alfred@test.zr',
                    phoneNumber: '+254710100000',
                    gender: 'female',
                    occupation: 'teacher',
                })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    corporateCustomerId = res.body.data.id;

                    request(app)
                        .post(`${baseUrl}/customers/${corporateCustomerId}/upload/businessCert`)
                        .set('authorization', `Bearer ${authToken}`)
                        .attach('file', nationalIdPng)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data).toHaveProperty('url');
                            done();
                        });
                });
        });

        test('List customers', (done) => {
            request(app)
                .get(`${baseUrl}/customers`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toBeInstanceOf(Array);
                    expect(res.body.data.map((i) => i.id)).toContain(customerId);
                    done();
                });
        });

        test('Fetches a customer by id', (done) => {
            request(app)
                .get(`${baseUrl}/customers/${customerId}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('kyc');
                    expect(res.body.data).toHaveProperty('email');
                    expect(res.body.data).toHaveProperty('address');
                    expect(res.body.data).toHaveProperty('lastName');
                    expect(res.body.data).toHaveProperty('firstName');
                    expect(res.body.data).toHaveProperty('phoneNumber');
                    expect(res.body.data.id).toEqual(customerId);
                    done();
                });
        });

        test('Fetches a customer by phone and email', (done) => {
            request(app)
                .get(`${baseUrl}/customers/phoneNumber/${customerPhone}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('kyc');
                    expect(res.body.data).toHaveProperty('email');
                    expect(res.body.data).toHaveProperty('address');
                    expect(res.body.data).toHaveProperty('lastName');
                    expect(res.body.data).toHaveProperty('firstName');
                    expect(res.body.data).toHaveProperty('phoneNumber');
                    expect(res.body.data.phoneNumber).toEqual(customerPhone);

                    request(app)
                        .get(`${baseUrl}/customers/email/${customerEmail}`)
                        .set('authorization', `Bearer ${authToken}`)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data).toHaveProperty('id');
                            expect(re.body.data).toHaveProperty('kyc');
                            expect(re.body.data).toHaveProperty('email');
                            expect(re.body.data).toHaveProperty('address');
                            expect(re.body.data).toHaveProperty('lastName');
                            expect(re.body.data).toHaveProperty('firstName');
                            expect(re.body.data).toHaveProperty('phoneNumber');
                            expect(re.body.data.email).toEqual(customerEmail);
                            done();
                        });
                });
        });

        test('Updates a customer', (done) => {
            request(app)
                .post(`${baseUrl}/customers/${customerId}`)
                .set('authorization', `Bearer ${authToken}`)
                .send({ lastName: 'Updated' })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);

                    request(app)
                        .get(`${baseUrl}/customers/${customerId}`)
                        .set('authorization', `Bearer ${authToken}`)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data.lastName).toEqual('Updated');
                            done();
                        });
                });
        });

        test('Uploads a customer\'s KYC documents', (done) => {
            request(app)
                .post(`${baseUrl}/customers/${customerId}/upload/nationalId`)
                .set('authorization', `Bearer ${authToken}`)
                .attach('file', nationalIdPdf)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);

                    request(app)
                        .get(`${baseUrl}/customers/${customerId}`)
                        .set('authorization', `Bearer ${authToken}`)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data.kyc.nationalId).toMatch(/^http:\/\//);
                            // eslint-disable-next-line max-len
                            documentFile = path.basename(new URL(re.body.data.kyc.nationalId).pathname);

                            request(app)
                                .post(`${baseUrl}/customers/${customerId}/upload/kraPin`)
                                .set('authorization', `Bearer ${authToken}`)
                                .attach('file', nationalIdPdf)
                                .expect(200)
                                .end((e, r) => {
                                    if (e) throw e;
                                    expect(r.body.status).toEqual(200);
                                    done();
                                });
                        });
                });
        });

        test('Uploads a document in image format', (done) => {
            request(app)
                .post(`${baseUrl}/customers/${customerId}/upload/nationalId`)
                .set('authorization', `Bearer ${authToken}`)
                .attach('file', nationalIdPng)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body).toHaveProperty('data');
                    expect(res.body.data).toHaveProperty('url');
                    const items = res.body.data.url.split('/');
                    const filename = items[items.length - 1];
                    const parts = filename.split('.');
                    const ext = parts[parts.length - 1];
                    expect(ext).toBe('png');
                    done();
                });
        });
    });

    describe('Applications', () => {
        test('Creates an application without application type', (done) => {
            request(app)
                .post(`${baseUrl}/applications`)
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    ...application,
                    customer: customerId,
                })
                .expect(400)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(400);
                    done();
                });
        });
        test('Creates an application', (done) => {
            request(app)
                .post(`${baseUrl}/applications`)
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    ...application,
                    applicationType: 'new',
                    customer: customerId,
                })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    applicationId = res.body.data.id;
                    done();
                });
        });

        test('List applications', (done) => {
            request(app)
                .get(`${baseUrl}/applications`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toBeInstanceOf(Array);
                    expect(res.body.data.map((i) => i.id)).toContain(applicationId);
                    request(app)
                        .get(`${baseUrl}/applications?filter=agent&value=fake`)
                        .set('authorization', `Bearer ${authToken}`)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data).toBeInstanceOf(Array);
                            expect(re.body.data).toHaveLength(0);
                            done();
                        });
                });
        });

        test('Fetches an application', (done) => {
            request(app)
                .get(`${baseUrl}/applications/${applicationId}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('agent');
                    expect(res.body.data).toHaveProperty('status');
                    expect(res.body.data).toHaveProperty('message');
                    expect(res.body.data).toHaveProperty('issuer');
                    expect(res.body.data).toHaveProperty('customer');
                    expect(res.body.data).toHaveProperty('duration');
                    expect(res.body.data).toHaveProperty('metadata');
                    expect(res.body.data.id).toEqual(applicationId);
                    done();
                });
        });

        test('Updates an application', (done) => {
            request(app)
                .post(`${baseUrl}/applications/${applicationId}`)
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    metadata: {
                        sumInsured: 86257,
                    },
                })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('agent');
                    expect(res.body.data).toHaveProperty('status');
                    expect(res.body.data).toHaveProperty('message');
                    expect(res.body.data).toHaveProperty('issuer');
                    expect(res.body.data).toHaveProperty('customer');
                    expect(res.body.data).toHaveProperty('duration');
                    expect(res.body.data).toHaveProperty('metadata');
                    expect(res.body.data.metadata.sumInsured).toEqual(86257);
                    expect(res.body.data.id).toEqual(applicationId);
                    done();
                });
        });

        test('Uploads an application\'s documents', (done) => {
            request(app)
                .post(`${baseUrl}/applications/${applicationId}/upload/logbook`)
                .set('authorization', `Bearer ${authToken}`)
                .attach('file', logbookPdf)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);

                    request(app)
                        .get(`${baseUrl}/applications/${applicationId}`)
                        .set('authorization', `Bearer ${authToken}`)
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            expect(re.body.data.metadata.logbook).toMatch(/^http:\/\//);

                            request(app)
                                .post(`${baseUrl}/applications/${applicationId}/upload/riskNote`)
                                .set('authorization', `Bearer ${authToken}`)
                                .attach('file', logbookPdf)
                                .expect(200)
                                .end((e, r) => {
                                    if (e) throw e;
                                    expect(r.body.status).toEqual(200);

                                    request(app)
                                        .post(`${baseUrl}/applications/${applicationId}/upload/valuation`)
                                        .set('authorization', `Bearer ${authToken}`)
                                        .attach('file', logbookPdf)
                                        .expect(200)
                                        .end((ee, rr) => {
                                            if (ee) throw ee;
                                            expect(rr.body.status).toEqual(200);
                                            done();
                                        });
                                });
                        });
                });
        });

        test('Approves an application', (done) => {
            request(app)
                .post(`${baseUrl}/applications/${applicationId}/approve`)
                .set('authorization', `Bearer ${authToken}`)
                .send()
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    done();
                });
        });

        test('Rejects an application', (done) => {
            request(app)
                .post(`${baseUrl}/applications`)
                .set('authorization', `Bearer ${authToken}`)
                .send({
                    ...application,
                    customer: customerId,
                    duration: '10y',
                })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    const { id } = res.body.data;
                    request(app)
                        .post(`${baseUrl}/applications/${id}/reject`)
                        .set('authorization', `Bearer ${authToken}`)
                        .send({ message: 'bad bad application ' })
                        .expect(200)
                        .end((er, re) => {
                            if (er) throw er;
                            expect(re.body.status).toEqual(200);
                            done();
                        });
                });
        });
    });

    describe('Policies', () => {
        test('List policies', (done) => {
            request(app)
                .get(`${baseUrl}/policies`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toBeInstanceOf(Array);
                    policyId = res.body.data[0].id;
                    done();
                });
        });

        test('Get Policies due for renewals', (done) => {
            request(app)
                .get(`${baseUrl}/policies/upcomingRenewals`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toBeInstanceOf(Array);
                    expect(res.body.data.length).toBe(0);
                    done();
                });
        });

        test('Fetch a policy by id', (done) => {
            request(app)
                .get(`${baseUrl}/policies/${policyId}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('number');
                    expect(res.body.data).toHaveProperty('metadata');
                    expect(res.body.data).toHaveProperty('application');
                    expect(res.body.data.id).toEqual(policyId);
                    done();
                });
        });

        test('Fetch a policy by agent Id', (done) => {
            request(app)
                .get(`${baseUrl}/policies/agent/${application.agent}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toBeInstanceOf(Array);
                    expect(res.body.data[0]).toHaveProperty('application');
                    expect(res.body.data[0].application).toHaveProperty('agent');
                    expect(res.body.data[0]).toHaveProperty('number');
                    expect(res.body.data[0]).toHaveProperty('metadata');
                    expect(res.body.data[0].metadata).toHaveProperty('policyNumber');
                    expect(res.body.data[0].application.agent).toBe(application.agent);
                    done();
                });
        });

        test('Fetch a policy by application Id', (done) => {
            request(app)
                .get(`${baseUrl}/policies/application/${applicationId}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('number');
                    expect(res.body.data).toHaveProperty('metadata');
                    expect(res.body.data).toHaveProperty('application');
                    done();
                });
        });

        test('Fetch a policy by policy number', (done) => {
            request(app)
                .get(`${baseUrl}/policies/number/${policyNumber}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    expect(res.body.data).toHaveProperty('id');
                    expect(res.body.data).toHaveProperty('number');
                    expect(res.body.data).toHaveProperty('metadata');
                    expect(res.body.data).toHaveProperty('application');
                    expect(res.body.data.number).toEqual(policyNumber);
                    done();
                });
        });
    });

    describe('Documents', () => {
        test('Fetches a document from storage', (done) => {
            request(app)
                .get(`${baseUrl}/documents/kyc/${documentFile}`)
                .set('authorization', `Bearer ${authToken}`)
                .expect(200)
                .expect('transfer-encoding', 'chunked')
                .end((err) => {
                    if (err) throw err;
                    done();
                });
        });
    });

    describe('Webhooks', () => {
        test('Processes notification directline', (done) => {
            request(app)
                .post(`${baseUrl}/webhooks/policies/directline`)
                .send({
                    policyNumber: 123123,
                    transactionNumber: 12312,
                    certificateNumber: 31231,
                    certificateURL: 'https://dededed',
                    carRegistrationNumber: application.metadata.registration,
                })
                .expect(200)
                .end((err, res) => {
                    if (err) throw err;
                    expect(res.body.status).toEqual(200);
                    done();
                });
        });
    });
});
