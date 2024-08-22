import mongoose from 'mongoose';

let db;
let TimetableSchema;
let TimetableModel;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error(`Invalid database: ${database}`);
        db = database;

        const ScheduleSchema = new mongoose.Schema({
            day: { type: SchemaTypes.String, required: [true, 'Schedule day is required'] },
            venue: { type: SchemaTypes.String, required: [true, 'Venue day is required'] },
            time: { type: SchemaTypes.String, required: [true, 'Schedule time is required'] },
        });

        TimetableSchema = db.Schema({
            unit: { type: SchemaTypes.ObjectId, ref: 'Unit', required: [true, 'The Unit is required for this schedule'] },
            schedule: [{ type: ScheduleSchema, required: true }],
        }, { strict: true, timestamps: true });

        TimetableSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
        delete ret._id; // eslint-disable-line
                return ret;
            },
        });
        TimetableModel = db.model('Timetable', TimetableSchema);
    },

    findAll: async () => {
        const data = await TimetableModel.find({}).populate('unit');
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    findBy: async (key, value) => {
        const data = await TimetableModel.findOne({ [key]: value }).populate('unit');
        if (data) {
            return data.toObject();
        }
        return null;
    },

    create: async (data) => {
        const stat = new TimetableModel(data);
        const res = await stat.save();
        if (res) {
            return res.toObject();
        }
        return null;
    },

    update: async (id, data) => {
        const res = await TimetableModel.updateOne({ _id: id }, data);
        if (res) {
            return true;
        }
        return false;
    },

    remove: async (id) => {
        await TimetableModel.deleteOne({ _id: id });
        return true;
    },
};

export default model;
