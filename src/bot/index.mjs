import config from 'config';
import NodeCache from 'node-cache';
import {
    createMachine, assign, interpret,
} from 'xstate';

import { makeScopedLogger } from '../utils/index.mjs';
import sendMessage from '../utils/wati.mjs';
import mongo from '../utils/db/index.mjs';

const services = {};

const sessions = new NodeCache({ stdTTL: config.get('bot.sessionTTL'), checkperiod: 15 });

// eslint-disable-next-line no-unused-vars
const setContextItem = (key, modifier = (val, _cxt) => val) => assign({
    [key]: (cxt, evt) => modifier(evt.payload.text, cxt),
});

export const botExists = (id) => services[id] ?? false;

export const destroyBot = (id) => {
    services[id]?.service?.stop();
    services[id] = undefined;
    sessions.del(id);
};

const initialListMessage = '*Select from below:*\n1) Requirements for progressing to the next level\n2) Know your units\n3) View Semester Timetable\n4) School portal\n5) School Canva\n6) School Library\n7) Contacts';

export const makeBot = async (id) => {
    const log = makeScopedLogger(id);

    const machine = createMachine({
        id,
        initial: 'inactive',
        predictableActionArguments: true,
        context: {
            item: undefined,
            admissionNumber: undefined,
        },
        states: {
            inactive: {
                entry: ['welcome'],
                on: {
                    PROCESS: {
                        target: 'item',
                    },
                },
            },
            item: {
                entry: ['listHelpItems'],
                on: {
                    PROCESS: [
                        {
                            target: 'requirements',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '1',
                        },
                        {
                            target: 'units',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '2',
                        },
                        {
                            target: 'timetable',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '3',
                        },
                        {
                            target: 'portal',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '4',
                        },
                        {
                            target: 'canva',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '5',
                        },
                        {
                            target: 'library',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '6',
                        },
                        {
                            target: 'contact',
                            actions: [setContextItem('item')],
                            cond: (ctx, { payload }) => payload.text === '7',
                        },
                    ],
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'inactive',
                    },
                },
            },
            admissionNumber: {
                entry: ['askForAdmissionNumber'],
                on: {
                    PROCESS: [
                        {
                            target: 'requirements',
                            actions: [setContextItem('admissionNumber')],
                            cond: (ctx) => ctx.item === '1',
                        },
                        {
                            target: 'final',
                            actions: [setContextItem('admissionNumber')],
                        },
                    ],
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            requirements: {
                entry: ['sendRequirements'],
                on: {
                    PROCESS: {
                        target: 'final',
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            units: {
                entry: ['askForAdmissionNumber'],
                on: {
                    PROCESS: {
                        target: 'final',
                        actions: [setContextItem('admissionNumber')],
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            timetable: {
                entry: ['askForAdmissionNumber'],
                on: {
                    PROCESS: {
                        target: 'final',
                        actions: [setContextItem('admissionNumber')],
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            portal: {
                entry: ['getPortalLink'],
                on: {
                    PROCESS: {
                        target: 'final',
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            canva: {
                entry: ['getCanvaLink'],
                on: {
                    PROCESS: {
                        target: 'final',
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            library: {
                entry: ['getLibraryLink'],
                on: {
                    PROCESS: {
                        target: 'final',
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            contact: {
                entry: ['getSchoolContacts'],
                on: {
                    PROCESS: {
                        target: 'final',
                    },
                    RESET: {
                        target: 'inactive',
                        actions: ['reset'],
                    },
                    BACK: {
                        target: 'item',
                    },
                },
            },
            final: {
                type: 'final',
                entry: ['exit'],
            },
        },
    }, {
        actions: {
            welcome: () => sendMessage(id, 'Hi my name is RU Chatbot, here to assist.'),
            listHelpItems: () => sendMessage(id, initialListMessage),
            askForAdmissionNumber: () => sendMessage(id, 'What\'s your admission number?').catch((err) => log.error('askForAdmissionNumber', err)),
            getPortalLink: () => sendMessage(id, 'Link to school portal is: \n http://student.riarauniversity.ac.ke/StudentPortal/Logins.aspx')
                .catch((err) => log.error('getPortalLink', err)),
            sendRequirements: async (cxt) => {
                const { admissionNumber } = cxt;
                const student = await mongo.students.findBy('admissionNumber', admissionNumber);
                if (!student) {
                    sendMessage(id, 'The Student could not be found in our records. Please check with admin');
                    return;
                }
                const course = await mongo.courses.findBy('course', student.course);
                if (!course) {
                    const message = `Course associalted with student: ${student.admissionNumber} does not exist!`;
                    log.error(message);
                    sendMessage(message);
                }
                const requirementResponse = [];
                const formattedResponse = course.requiredUnits.map((reqUnit) => requirementResponse.push(`${reqUnit.unitId.name}: ${reqUnit.compulsory ? 'Required' : 'Optional'}`));
                const formattedMessage = `Hi ${student.name},\nYour course is: ${course.name}\nThe following units are required to graduate:\n${formattedResponse.join('\n')}`;
                sendMessage(id, formattedMessage);
            },
            getCanvaLink: () => sendMessage(id, 'Link to Canva is : \nhttps://online.riarauniversity.ac.ke/?login_success=1').catch((err) => log.error('getCanvaLink', err)),
            getLibraryLink: () => sendMessage(id, 'Link to Library resource is: \nhttps://library.riarauniversity.ac.ke/e-resources/').catch((err) => log.error('getLibraryLink', err)),
            getSchoolContacts: () => sendMessage(id, 'School contact is: \t +254721931022').catch((err) => log.error('getSchoolContacts', err)),
            reset: (_cxt, evt) => {
                const session = services[id];
                if (!session) {
                    return;
                }
                destroyBot(id);
                sendMessage(evt.payload.phone, 'Your chat session has been ended!');
            },
            exit: (_cxt, evt) => {
                const session = services[id];
                if (!session) {
                    return;
                }
                destroyBot(id);
                sendMessage(evt.payload.phone, 'Bye!');
            },
        },
        guards: {
        },
    });

    const service = interpret(machine);

    services[id] = {
        log,
        machine,
        service,
    };

    service.onTransition((st) => {
        services[id].state = st;
    });

    service.subscribe((st, evt) => {
        log.info(st.value, JSON.stringify({
            ...st.context,
        }), `${evt.type}: ${evt.payload?.text ?? 'N/A'}`);
    }, (err) => {
        log.error(err);
    }, () => {
        sessions.del(id);
        log.info('Done!');
    });

    service.start();
    sessions.set(id, Date.now());
    return services[id];
};

export const getBot = (id) => services[id] ?? makeBot(id);

sessions.on('expired', (id) => {
    const session = services[id];
    if (!session) {
        return;
    }
    destroyBot(id);
    sendMessage(id, 'Oops, your session has expired!\nSay Hi to start a new one')
        .catch((err) => session.log.error('expiredSession', err));
});
