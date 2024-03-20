import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

let db;
let GrossWrittenPremiumModel;
let GrossWrittenPremiumSchema;
const SchemaTypes = mongoose.Schema.Types;

const model = {

    setDB: async (database) => {
        if (!database) throw new Error(`Invalid database: ${database}`);
        db = database;

        GrossWrittenPremiumSchema = db.Schema({
            agent: { type: SchemaTypes.String, required: [true, 'An agent is required for this entry'] },
            grossWrittenPremium: { type: SchemaTypes.Number, required: [true, 'The GWP amount is required for this entry'] },
            agentLeader: { type: SchemaTypes.String, required: [true, 'An agent leader is required for this entry'] },
        }, { strict: true, timestamps: true });

        GrossWrittenPremiumSchema.plugin(mongoosePaginate);

        GrossWrittenPremiumSchema.set('toObject', {
            getters: true,
            virtuals: true,
            transform: (doc, ret) => {
                delete ret._id; // eslint-disable-line
                return ret;
            },
        });
        GrossWrittenPremiumModel = db.model('GrossWrittenPremium', GrossWrittenPremiumSchema);
    },

    truncate: async () => GrossWrittenPremiumModel.deleteMany({}),

    findAll: async () => {
        const data = await GrossWrittenPremiumModel.find({});
        if (data) {
            return data.map((i) => i.toObject());
        }
        return null;
    },

    create: async (data) => {
        const stat = new GrossWrittenPremiumModel(data);
        const res = await stat.save();
        if (res) {
            return res.toObject();
        }
        return null;
    },
    paginate: async (filter, { offset = 0, limit = 50 }) => {
        const data = await GrossWrittenPremiumModel
            .paginate(
                filter,
                {
                    offset: offset === 1 ? 0 : offset,
                    limit,
                    sort: { createdAt: -1 },
                },
            );
        if (data) {
            return data;
        }
        return false;
    },
};

export default model;
