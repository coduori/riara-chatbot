import config from 'config';
import twilio from 'twilio';

import { log } from './index.mjs';

const { accountSid, authToken, senderPhoneNumber } = config.get('twillio');

const client = twilio(accountSid, authToken);
const sendMessage = async (recepientPhoneNumber, messageText) => client.messages
    .create({
        from: `whatsapp:${senderPhoneNumber}`,
        body: messageText,
        to: `whatsapp:+${recepientPhoneNumber}`,
    })
    .then((message) => log.info(message.sid));

export default sendMessage;
