import mongoose from 'mongoose';

let db;
let UnitSchema;
let UnitModel;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error(`Invalid database: ${database}`);
        db = database;

        UnitSchema = db.Schema({
            code: { type: SchemaTypes.String, required: true, unique: true },
            name: { type: SchemaTypes.String, required: true },
        }, { strict: true, timestamps: true });

        UnitSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
        delete ret._id; // eslint-disable-line
                return ret;
            },
        });
        UnitModel = db.model('Unit', UnitSchema);
    },

    findAll: async () => {
        const data = await UnitModel.find({});
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    findBy: async (key, value) => {
        const data = await UnitModel.findOne({ [key]: value });
        if (data) {
            return data.toObject();
        }
        return null;
    },

    create: async (data) => {
        const stat = new UnitModel(data);
        const res = await stat.save();
        if (res) {
            return res.toObject();
        }
        return null;
    },

    update: async (id, data) => {
        const res = await UnitModel.updateOne({ _id: id }, data);
        if (res) {
            return true;
        }
        return false;
    },

    remove: async (id) => {
        await UnitModel.deleteOne({ _id: id });
        return true;
    },
};

export default model;
