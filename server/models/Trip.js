import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({

type:{
 type:String,
 default:"trip"
},

tripCode:{
 type:String,
 unique:true
},

jeepney:{
 type:mongoose.Schema.Types.ObjectId,
 ref:'Jeepney',
 required:true
},

route:{
 type:mongoose.Schema.Types.ObjectId,
 ref:'Route',
 required:true
},

schedule:{
 type:mongoose.Schema.Types.ObjectId,
 ref:'Schedule',
 required:true
},

tripDate:{
 type:Date,
 default:Date.now
},

passengerCount:{
 type:Number,
 default:0
},

estimatedRevenue:{
 type:Number,
 default:0
},

status:{
 type:String,
 enum:[
 'Scheduled',
 'Boarding',
 'In Transit',
 'Completed',
 'Cancelled'
 ],
 default:'Scheduled'
}

},
{
timestamps:true
});


tripSchema.pre(

'save',

async function(next){

if(!this.tripCode){

const count=

await this.constructor.countDocuments();

this.tripCode=

`TR-${String(count+1).padStart(5,'0')}`;

}

next();

}

);

export default mongoose.model(

'Trip',

tripSchema

);