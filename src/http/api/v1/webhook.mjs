import { Router } from 'express';
import axios from 'axios';
import config from 'config';

import { sendSuccess } from './utils/responses.mjs';
import { getBot } from '../../../bot/index.mjs';
import { makeScopedLogger } from '../../../utils/index.mjs';

const router = new Router();
const log = makeScopedLogger('webhook');

router.post('/:action(message)', async (req, res) => {
    log.info(`Anf the request payload is: ${JSON.stringify(req.body)}`);
    const { accountSid, authToken } = config.get('twillio');
    if (req.MediaUrl0) {
        const image = await axios
            .get(req.MediaUrl0, { auth: { username: accountSid, password: authToken } });
        // download document and upload to minio
    }
    try {
        const data = req.body;
        const { action } = req.params;

        switch (action) {
        case 'message': {
            const bot = await getBot(data.WaId);
            const payload = {
                phone: data.WaId,
                senderName: data.ProfileName,
                text: null,
            };

            if (data.MessageType === 'text') {
                payload.text = data.Body;
            }

            if (['cancel', 'reset', 'close'].includes((payload.text || '').toLowerCase())) {
                bot.service.send('RESET', { payload });
            } else if ((payload.text || '').toLowerCase() === 'back') {
                bot.service.send('BACK', {});
            } else {
                bot.service.send('PROCESS', { payload });
            }
            break;
        }
        default:
            break;
        }
    } catch (error) {
        log.error(error);
    }
    sendSuccess(res);
});

// router.post('/callback', async (req, res) => {
//     log.info('=====================================');
//     log.info(JSON.stringify(req.body));
//     log.info('=====================================');
//     return sendSuccess(res, 'logged successfully!');
// });

export default router;
