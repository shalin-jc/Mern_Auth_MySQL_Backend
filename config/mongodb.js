import mongoose from "mongoose";
const connectDB = async () => {
    try {
        
        mongoose.connection.on("connected", ()=>console.log("MongoDB connected"))
        await mongoose.connect(`${process.env.MONGODB_URI}/authentication` );
    } catch (error) {
        console.error("MongoDB connection failed", error);
    }

    

}

export default connectDB;