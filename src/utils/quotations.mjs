import config from 'config';

import invoke from './http.mjs';
import { log } from './index.mjs';
import { sendBadRequest } from '../http/api/v1/utils/responses.mjs';

const {
    baseUrl,
    paths,
} = config.get('internalServices.quotation');

const getGWPfromQuote = async (paymentCode, token) => {
    const res = await invoke('GET', baseUrl, `${paths.getQuotation}/${paymentCode}`, {}, null, token);

    if (res.status !== 200) {
        log.warn(JSON.stringify(res) || 'Could not get a response from the quotations service.');
        return sendBadRequest(res, 'Failed to get GWP! Please check your authentication and payment code.');
    }

    return res.data;
};

export default getGWPfromQuote;
