import mongoose from 'mongoose';

const MUNICIPALITIES = [

  'Solano',

  'Bayombong',

  'Bagabag',

  'Bambang',

  'Aritao',

  'Sta. Fe'

];

const routeSchema = new mongoose.Schema({

  routeCode: {

    type: String,

    unique: true

  },

  origin: {

    type: String,

    required: true,

    enum: MUNICIPALITIES

  },

  destination: {

    type: String,

    required: true,

    enum: MUNICIPALITIES,

    validate: {

      validator(value) {

        return value !== this.origin;

      },

      message:

        'Origin and destination cannot be identical'

    }

  },

  estimatedTravelTime: {

    type: Number,

    required: true,

    min: 1

  },

  estimatedFare: {

    type: Number,

    required: true,

    min: 1

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

timestamps:true

}

);


routeSchema.index(

{

origin:1,

destination:1

},

{

unique:true

}

);

routeSchema.index(

{

status:1

}

);


routeSchema.pre(
'save',
async function(){

if(!this.isNew){

return;

}


if(!this.routeCode){

const count =
await this.constructor.countDocuments();


this.routeCode =
`RTE-${String(
count + 1
).padStart(3,'0')}`;

}


});


const Route =

mongoose.models.Route ||

mongoose.model(

'Route',

routeSchema

);

export default Route;