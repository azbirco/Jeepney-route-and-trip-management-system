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
},

// =========================
// Admin Override tracking
// =========================
// Terminal Personnel owns normal CRUD on trips (Scheduled/Cancelled
// status). Driver owns Departed/Arrived via the status-report flow.
// These fields exist solely to record and surface an Admin's
// correction of a bad Terminal Personnel entry, and to let Terminal
// Personnel acknowledge or dispute that correction.

lastOverriddenBy:{ type:mongoose.Schema.Types.ObjectId, ref:'User', default:null },

overrideReason:{ type:String, default:'' },

overriddenAt:{ type:Date, default:null },

// true while waiting for Terminal Personnel to acknowledge or dispute
overridePending:{ type:Boolean, default:false },

// filled in by Terminal Personnel if they push back on the override
overrideDisputeReason:{ type:String, default:'' }

},
{ timestamps:true });


tripSchema.pre('save', async function(){
if(!this.tripCode){
const count = await this.constructor.countDocuments();
this.tripCode = `TR-${String(count+1).padStart(5,'0')}`;
}
});

export default mongoose.model('Trip', tripSchema);