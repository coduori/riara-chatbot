import mongoose from 'mongoose';

let db;
let StudentSchema;
let StudentModel;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error('Developer Error: No database passed!');
        db = database;

        StudentSchema = db.Schema({
            admissionNumber: { type: SchemaTypes.String, required: true },
            name: { type: SchemaTypes.String, required: true },
            course: { type: SchemaTypes.ObjectId, ref: 'Course', required: true },
        }, { strict: true, timestamps: true });

        StudentSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
        delete ret._id; // eslint-disable-line
                return ret;
            },
        });
        StudentModel = db.model('Student', StudentSchema);
    },

    findAll: async () => {
        const data = await StudentModel.find({});
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    findBy: async (key, value) => {
        const data = await StudentModel.findOne({ [key]: value });
        if (data) {
            return data.toObject();
        }
        return null;
    },

    create: async (data) => {
        const stat = new StudentModel(data);
        const res = await stat.save();
        if (res) {
            return res.toObject();
        }
        return null;
    },

    update: async (id, data) => {
        const res = await StudentModel.updateOne({ _id: id }, data);
        if (res) {
            return true;
        }
        return false;
    },

    remove: async (id) => {
        await StudentModel.deleteOne({ _id: id });
        return true;
    },
};

export default model;
