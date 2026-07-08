import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(

  {

    reportType: {

      type: String,

      required: true,

      enum: [

        'Daily Trip Report',

        'Passenger Summary Report',

        'Route Summary Report',

        'Jeepney Activity Report',

        'Revenue Summary Report'

      ]

    },



    generatedBy: {

      type: mongoose.Schema.Types.ObjectId,

      ref: 'User',

      default: null

    },



    dateFrom: {

      type: Date,

      required: true

    },



    dateTo: {

      type: Date,

      required: true

    },



    summaryData: {

      type: mongoose.Schema.Types.Mixed,

      default: {}

    }

  },



  {

    timestamps: true

  }

);



const Report = mongoose.model(

  'Report',

  reportSchema

);



export default Report;