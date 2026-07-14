import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({

  scheduleCode: {
    type: String,
    unique: true
  },

  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },

  departureTime: {
    type: String,
    required: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/
  },

  expectedArrivalTime: {
    type: String
  },

  status: {
    type: String,
    enum: [
      'Active',
      'Inactive'
    ],
    default: 'Active'
  },

  // =========================
  // Admin Override tracking
  // =========================
  // Terminal Personnel owns normal CRUD on schedules. These fields exist
  // solely to record and surface an Admin's correction of a bad entry,
  // and to let Terminal Personnel acknowledge or dispute that correction.

  lastOverriddenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  overrideReason: {
    type: String,
    default: ''
  },

  overriddenAt: {
    type: Date,
    default: null
  },

  // true while waiting for Terminal Personnel to acknowledge or dispute
  overridePending: {
    type: Boolean,
    default: false
  },

  // filled in by Terminal Personnel if they push back on the override
  overrideDisputeReason: {
    type: String,
    default: ''
  }

},
{
  timestamps: true
});


scheduleSchema.index({
  route: 1,
  departureTime: 1
},
{
  unique: true
});


function calculateArrivalTime(
  departureTime,
  travelTime
){

  const [h,m] =
  departureTime
  .split(':')
  .map(Number);

  const total =
  h*60+m+travelTime;

  const nh =
  Math.floor(total/60)%24;

  const nm =
  total%60;

  return `${String(nh)
  .padStart(2,'0')}:${String(nm)
  .padStart(2,'0')}`;

}


scheduleSchema.pre(

'validate',

async function(){

try{

const Route =
mongoose.model('Route');

const route =

await Route.findById(
this.route
);

if(

route &&

this.departureTime

){

this.expectedArrivalTime =

calculateArrivalTime(

this.departureTime,

route.estimatedTravelTime

);

}

}

catch(err){

throw err;

}

}

);


scheduleSchema.pre(

'save',

async function(){

if(!this.isNew){

return;

}

if(!this.scheduleCode){

const count =

await this.constructor
.countDocuments();

this.scheduleCode =

`SCH-${String(

count+1

).padStart(3,'0')}`;

}

}

);


const Schedule =

mongoose.models.Schedule ||

mongoose.model(

'Schedule',

scheduleSchema

);

export default Schedule;