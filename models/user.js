import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        validate: validator.isEmail,

    },
    password: {
        type: String,
        required: true,
        minLength: [6, "password must be greate than 5 characters"],
        maxLength: [32, "password cannot exceed more than 32 characters"],
        select: false
    },
    role: {
        type: String,
        required: true,
        enum: ["Employer", "JobSeeker"]
    }

})

//hashing password

userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    this.password = await bcrypt.hash(this.password, 10);
})

//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

//jwt token

userSchema.methods.getToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRE });
}


const User = mongoose.model("User", userSchema);

export default User;