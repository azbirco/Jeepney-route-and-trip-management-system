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

departureDate:{
 type:Date,
 default:Date.now
},

actualDepartureTime:{
 type:String,
 default:''
},

actualArrivalTime:{
 type:String,
 default:''
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
 'Departed',
 'Arrived',
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

async function(){

if(!this.tripCode){

const count=

await this.constructor.countDocuments();

this.tripCode=

`TR-${String(count+1).padStart(5,'0')}`;

}

}

);

export default mongoose.model(

'Trip',

tripSchema

);