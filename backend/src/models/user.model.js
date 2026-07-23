import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    email : {
        type : String,
        unique : true,
        required : true
    },
    avtar : {
        type : String
    },
    tokens : {
        access_token : { type : String },
        refresh_token : { type : String  },
        scope : { type : String  },
        token_type : { type : String  },
        expiry_date : { type : Number}
    },
    historyId :{
        type : String,
        default : null
    },
    isActive : { 
        type : Boolean,
        default : null
    },
}, { timestamps: true })

export const User = mongoose.model("user", UserSchema);