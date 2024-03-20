import { Router } from 'express';

import grossWrittenPremiums from './grossWrittenPremiums/index.mjs';

import authenticator from './utils/authenticator.mjs';
import { inputLogger, responseSender } from './utils/responses.mjs';

const router = new Router();

router.use(authenticator);
router.use(responseSender);
router.use(inputLogger);

router.use('/grossWrittenPremiums', grossWrittenPremiums);

export default router;
