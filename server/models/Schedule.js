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

async function(next){

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

next();

}

catch(err){

next(err);

}

}

);


scheduleSchema.pre(

'save',

async function(next){

if(!this.isNew){

return next();

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

next();

}

);


const Schedule =

mongoose.models.Schedule ||

mongoose.model(

'Schedule',

scheduleSchema

);

export default Schedule;