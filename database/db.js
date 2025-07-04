// import mongoose from "mongoose";

// export const conn = async() =>{
//     try{
//       await mongoose.connect(process.env.DB)
//       console.log("database sucess")
//     }catch(error){
//         console.log(error);
//     }
// }


import mongoose from "mongoose";

// Connection options for better performance
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
};

export const conn = async () => {
  try {
    // Check if already connected
    if (mongoose.connections[0].readyState) {
      console.log("Database already connected");
      return;
    }

    // Add connection timeout
    const connectTimeout = setTimeout(() => {
      throw new Error('Database connection timeout after 8 seconds');
    }, 8000);

    await mongoose.connect(process.env.DB, options);
    clearTimeout(connectTimeout);
    
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};