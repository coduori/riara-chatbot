import mongoose from 'mongoose';

import { log } from '../index.mjs';

let db;
let UnitStatusSchema;
let UnitStatusModel;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error(`Invalid database: ${database}`);
        db = database;

        UnitStatusSchema = db.Schema({
            student: { type: SchemaTypes.ObjectId, ref: 'Student', required: true },
            unit: { type: SchemaTypes.ObjectId, ref: 'Unit', required: true },
            status: { type: SchemaTypes.String, required: true, enum: ['done', 'doing', 'pending'] },
        }, { strict: true, timestamps: true });

        UnitStatusSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
                delete ret._id; // eslint-disable-line
                return ret;
            },
        });

        UnitStatusSchema.index({ student: 1, unit: 1 }, { unique: true, message: 'This Unit already exists for this student. Would you like to update the status instead?' });

        UnitStatusModel = db.model('UnitStatus', UnitStatusSchema);
    },

    findAll: async () => {
        const data = await UnitStatusModel.find({}).populate('unit').populate('student');
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    findBy: async (key, value) => {
        const data = await UnitStatusModel.findOne({ [key]: value }).populate('unit').populate('student');
        if (data) {
            return data.toObject();
        }
        return null;
    },

    findAllBy: async (key, value) => {
        const data = await UnitStatusModel.find({ [key]: value }).populate('unit').populate('student');
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    create: async (data) => {
        const stat = new UnitStatusModel(data);
        try {
            const res = await stat.save();
            if (res) {
                return res.toObject();
            }
            return null;
        } catch (err) {
            log.error(err);
            err.error = true;
            return err;
        }
    },

    update: async (id, data) => {
        const res = await UnitStatusModel.updateOne({ _id: id }, data);
        if (res) {
            return true;
        }
        return false;
    },

    remove: async (id) => {
        await UnitStatusModel.deleteOne({ _id: id });
        return true;
    },
};

export default model;
