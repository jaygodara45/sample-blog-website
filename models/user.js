const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
try{

    mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
} catch (err){
    console.log('Could not connect to db');
}

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    pic: {
        type: String,
        default: "default.jpeg"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post"
        }
    ]
})

module.exports =  mongoose.model('user', userSchema);