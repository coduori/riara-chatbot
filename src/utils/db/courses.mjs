import mongoose from 'mongoose';

let db;
let CourseSchema;
let CourseModel;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error(`Invalid database: ${database}`);
        db = database;

        CourseSchema = db.Schema({
            code: { type: SchemaTypes.String, required: true },
            name: { type: SchemaTypes.String, required: true },
            requiredUnits: [{
                unitId: { type: SchemaTypes.ObjectId, ref: 'Unit', required: true },
                compulsory: { type: SchemaTypes.Boolean, default: false },
            }],
        }, { strict: true, timestamps: true });

        CourseSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
              delete ret._id; // eslint-disable-line
                return ret;
            },
        });
        CourseModel = db.model('Course', CourseSchema);
    },

    findAll: async () => {
        const data = await CourseModel.find({}).populate('unitId');
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    findBy: async (key, value) => {
        const data = await CourseModel.findOne({ [key]: value }).populate('unitId');
        if (data) {
            return data.toObject();
        }
        return null;
    },

    create: async (data) => {
        const stat = new CourseModel(data);
        const res = await stat.save();
        if (res) {
            return res.toObject();
        }
        return null;
    },

    update: async (id, data) => {
        const res = await CourseModel.updateOne({ _id: id }, data);
        if (res) {
            return true;
        }
        return false;
    },

    remove: async (id) => {
        await CourseModel.deleteOne({ _id: id });
        return true;
    },
};

export default model;
