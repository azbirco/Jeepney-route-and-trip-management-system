import mongoose from 'mongoose';

const jeepneySchema = new mongoose.Schema(
{
  jeepneyNumber: {
    type: String,
    unique: true,
    trim: true
  },

  plateNumber: {
    type: String,
    required: [true, 'Plate number is required'],
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
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be greater than zero']
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

},
{
  timestamps: true
});


// AUTO GENERATE JEEPNEY NUMBER
jeepneySchema.pre('save', async function () {

  if (!this.isNew) {
    return;
  }


  if (!this.jeepneyNumber) {

    const count = await mongoose
      .model('Jeepney')
      .countDocuments();


    this.jeepneyNumber =
      `JPU-${String(count + 1).padStart(3, '0')}`;

  }

});


const Jeepney =
  mongoose.models.Jeepney ||
  mongoose.model(
    'Jeepney',
    jeepneySchema
  );


export default Jeepney;