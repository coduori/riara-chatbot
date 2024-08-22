import { Router } from 'express';
import Joi from 'joi';

import { sendSuccess, sendBadRequest, sendServerError } from './utils/responses.mjs';
import { makeScopedLogger, mongoObjectIdPattern, schedulePattern } from '../../../utils/index.mjs';
import mongo from '../../../utils/db/index.mjs';

const router = new Router();
const log = makeScopedLogger('admin');

// course
router.post('/courses', async (req, res) => {
    const inputSchema = Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        requiredUnits: Joi.array().items({
            unitId: Joi.string().regex(mongoObjectIdPattern).required(),
            compulsory: Joi.boolean().optional(),
        }).required(),
    });

    const { error } = inputSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }
    let addedCourse;
    try {
        const course = req.body;
        addedCourse = await mongo.courses.create(course);
    } catch (err) {
        log.error(err);
        return sendServerError(res);
    }

    return sendSuccess(res, addedCourse);
});

router.post('/students', async (req, res) => {
    const inputSchema = Joi.object({
        admissionNumber: Joi.string().required(),
        name: Joi.string().required(),
        course: Joi.string().required(),
    });

    const { error } = inputSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }
    let enrolledStudent;
    try {
        const student = req.body;
        enrolledStudent = await mongo.students.create(student);
    } catch (err) {
        log.error(err);
        return sendServerError(res);
    }

    return sendSuccess(res, enrolledStudent);
});

router.post('/units', async (req, res) => {
    const inputSchema = Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
    });

    const { error } = inputSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }
    let addedUnit;
    try {
        const unit = req.body;
        addedUnit = await mongo.units.create(unit);
    } catch (err) {
        log.error(err);
        return sendServerError(res);
    }

    return sendSuccess(res, addedUnit);
});

router.post('/unit-status', async (req, res) => {
    const inputSchema = Joi.object({
        student: Joi.string().regex(mongoObjectIdPattern).required(),
        unit: Joi.string().regex(mongoObjectIdPattern).required(),
        status: Joi.string().valid('doing', 'done').required(),
    });

    const { error } = inputSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }
    let unitStatus;
    try {
        const status = req.body;
        unitStatus = await mongo.unitStatus.create(status);
    } catch (err) {
        log.error(err);
        return sendServerError(res);
    }
    if (unitStatus.error) {
        return sendBadRequest(res, unitStatus);
    }

    return sendSuccess(res, unitStatus);
});

router.post('/timetable', async (req, res) => {
    const inputSchema = Joi.object({
        unit: Joi.string().regex(mongoObjectIdPattern).required(),
        schedule: Joi.array().items({
            day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday').required(),
            time: Joi.string().regex(schedulePattern).required(),
            venue: Joi.string().required(),
        }).required(),
    });

    const { error } = inputSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join('. ');
        log.error(errorMessage);
        return sendBadRequest(res, errorMessage);
    }
    let timetable;
    try {
        const schedule = req.body;
        timetable = await mongo.timetables.create(schedule);
    } catch (err) {
        log.error(err);
        return sendServerError(res);
    }
    if (timetable.error) {
        return sendBadRequest(res, timetable);
    }

    return sendSuccess(res, timetable);
});

export default router;
