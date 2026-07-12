import mongoose from "mongoose";

const tripSchema = new mongoose.Schema({

type:{ type:String, default:"trip" },

tripCode:{ type:String, unique:true },

jeepney:{ type:mongoose.Schema.Types.ObjectId, ref:'Jeepney', required:true },

route:{ type:mongoose.Schema.Types.ObjectId, ref:'Route', required:true },

schedule:{ type:mongoose.Schema.Types.ObjectId, ref:'Schedule', required:true },

driver:{ type:mongoose.Schema.Types.ObjectId, ref:'User', default:null },

departureDate:{ type:Date, default:Date.now },

actualDepartureTime:{ type:String, default:'' },

actualArrivalTime:{ type:String, default:'' },

// Pending-confirmation flow: Driver reports arrival here, Terminal
// Personnel/Admin confirms it before status officially becomes 'Arrived'.
arrivalReported:{ type:Boolean, default:false },

arrivalReportedAt:{ type:Date, default:null },

// Driver-facing notification flag. Set to false whenever a Driver needs
// to be alerted (newly assigned, reassigned, or their trip got
// cancelled). Flips back to true once the Driver visits "My Trips".
driverNotified:{ type:Boolean, default:true },

passengerCount:{ type:Number, default:0 },

estimatedRevenue:{ type:Number, default:0 },

status:{
 type:String,
 enum:['Scheduled','Departed','Arrived','Cancelled'],
 default:'Scheduled'
}

},
{ timestamps:true });


tripSchema.pre('save', async function(){
if(!this.tripCode){
const count = await this.constructor.countDocuments();
this.tripCode = `TR-${String(count+1).padStart(5,'0')}`;
}
});

export default mongoose.model('Trip', tripSchema);