import { Router } from 'express';

import { sendSuccess } from './utils/responses.mjs';
import { getBot } from '../../../bot/index.mjs';
import { makeScopedLogger } from '../../../utils/index.mjs';

const router = new Router();
const log = makeScopedLogger('webhook');

router.post('/:action(message)', async (req, res) => {
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
