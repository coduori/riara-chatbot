import { Router } from 'express';

import webhook from './webhook.mjs';
import admin from './admin.mjs';
import { responseSender } from './utils/responses.mjs';

const router = new Router();

router.use(responseSender);

router.use('/webhook', webhook);
router.use('/admin', admin);

export default router;
