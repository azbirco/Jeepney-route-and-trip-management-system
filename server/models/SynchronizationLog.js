import mongoose from 'mongoose';

const synchronizationLogSchema = new mongoose.Schema({

  syncId: {
    type: String,
    unique: true
  },

  lastSync: {
    type: Date,
    default: Date.now
  },

  recordsTransmitted: {
    type: Number,
    default: 0,
    min: 0
  },

  syncStatus: {
    type: String,
    enum: [
      'Pending',
      'Success',
      'Failed'
    ],
    default: 'Pending'
  },

  payload: {
    type: Object,
    default: {}
  },

  apiResponse: {
    type: Object,
    default: null
  },

  errorMessage: {
    type: String,
    default: null
  }

}, {

  timestamps: true

});


synchronizationLogSchema.index({

  syncStatus: 1

});

synchronizationLogSchema.index({

  createdAt: -1

});

synchronizationLogSchema.index({

  syncId: 1

});


synchronizationLogSchema.pre(

  'save',

  async function (next) {

    if (!this.isNew) {

      return next();

    }

    if (!this.syncId) {

      const count =

        await this.constructor.countDocuments();

      this.syncId =

        `SYNC-${String(

          count + 1

        ).padStart(5, '0')}`;

    }

    next();

  }

);


const SynchronizationLog =

  mongoose.models.SynchronizationLog ||

  mongoose.model(

    'SynchronizationLog',

    synchronizationLogSchema

  );


export default SynchronizationLog;