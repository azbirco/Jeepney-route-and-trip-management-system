import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({

  username:{

    type:String,

    required:true,

    unique:true,

    trim:true,

    minlength:3

  },

  email:{

    type:String,

    required:true,

    unique:true,

    trim:true,

    lowercase:true

  },

  password:{

    type:String,

    required:true,

    minlength:6,

    select:false

  },

  role:{

    type:String,

    enum:[

      'Admin',

      'Terminal Personnel'

    ],

    default:'Terminal Personnel'

  },

  fullName:{

    type:String,

    required:true,

    trim:true

  },

  isActive:{

    type:Boolean,

    default:true

  }

},

{

timestamps:true,

toJSON:{

transform(doc,ret){

delete ret.password;

return ret;

}

}

}

);


userSchema.index({

username:1

});

userSchema.index({

email:1

});


userSchema.pre(

'save',

async function(next){

if(

!this.isModified(

'password'

)

){

return next();

}

const salt =

await bcrypt.genSalt(10);

this.password =

await bcrypt.hash(

this.password,

salt

);

next();

}

);


userSchema.methods.comparePassword =

async function(password){

return bcrypt.compare(

password,

this.password

);

};


const User =

mongoose.models.User ||

mongoose.model(

'User',

userSchema

);

export default User;