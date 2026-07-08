import mongoose from 'mongoose';

const jeepneySchema = new mongoose.Schema({

  jeepneyNumber: {
    type: String,
    unique: true
  },

  plateNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  type: {
    type: String,
    enum: [
      'Traditional Jeepney',
      'E-Jeep'
    ],
    default: 'Traditional Jeepney'
  },

  capacity: {
    type: Number,
    required: true,
    min: 1
  },

  status: {
    type: String,
    enum: [
      'Available',
      'In Transit',
      'Inactive'
    ],
    default: 'Available'
  }

}, {
  timestamps: true
});


jeepneySchema.pre('save', async function (next) {

  if (!this.isNew) {
    return next();
  }

  if (!this.jeepneyNumber) {

    const count = await this.constructor.countDocuments();

    this.jeepneyNumber =
      `JPU-${String(count + 1).padStart(3, '0')}`;

  }

  next();

});


const Jeepney =
  mongoose.models.Jeepney ||
  mongoose.model(
    'Jeepney',
    jeepneySchema
  );

export default Jeepney;