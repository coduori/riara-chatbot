/* eslint-disable max-len */
import { Router } from 'express';
import Joi from 'joi';

import { log } from '../../../../utils/index.mjs';
import getGWPfromQuote from '../../../../utils/quotations.mjs';
import { sendBadRequest, sendServerError, sendSuccess } from '../utils/responses.mjs';
import mongo from '../../../../utils/db/index.mjs';

const router = new Router();

// paginate, use query params for agent
router.get('/', async (req, res) => {
    const {
        agentId, agentLeaderId, page = 1, limit = 10,
    } = req.query;
    const query = {};
    if (agentId) {
        query.agentId = agentId;
    }
    if (agentLeaderId) {
        query.agentLeaderId = agentLeaderId;
    }
    const options = {
        offset: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const response = await mongo.grossWrittenPremiums.paginate(query, options);
    if (!response) {
        return sendBadRequest(res, 'Could not fetch records!');
    }
    return sendSuccess(res, response);
});

// validate
router.post('/', async (req, res) => {
    const inputSchema = Joi.object({
        paymentCode: Joi.string().required(),
    });
    const { error } = inputSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }

    const agentGWP = await getGWPfromQuote(req.body.paymentCode, req.token, res);
    log.info(`Quotation service response: ::: ${JSON.stringify(agentGWP)}`);
    const result = await mongo.grossWrittenPremiums.create(agentGWP);
    if (result) {
        return sendSuccess(res, 'GWP added successfully!');
    }
    return sendServerError(res, 'Could not add GWP!');
});

export default router;
