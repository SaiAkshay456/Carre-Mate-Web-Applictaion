import mongoose from "mongoose";

export const connectToDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("connected to mongodb");
    }
    catch (err) {
        console.log("An error occurred while connecting mongodb..")
    }
}

