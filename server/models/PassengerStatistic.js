import mongoose from 'mongoose';

const passengerStatisticSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      unique: true
    },

    passengerCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    occupancyRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    estimatedRevenue: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const PassengerStatistic = mongoose.model(
  'PassengerStatistic',
  passengerStatisticSchema
);

export default PassengerStatistic;