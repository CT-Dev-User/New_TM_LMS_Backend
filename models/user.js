// import mongoose from "mongoose";

// const schema = new mongoose.Schema(
//     {
//         name: {
//             type: String,
//             required: true,
//         },
//         email: {
//             type: String,
//             required: true,
//             unique: true,
//         },
//         password: {
//             type: String,
//             required: true,
//         },
//         role: {
//             type: String,
//             default: "user",
//             enum: ["user", "admin", "instructor"] // Optional: restricts values
//         },
//         subscription: [{
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Courses",
//         }],
//         // Fields for password reset
//         resetPasswordToken: {
//             type: String,
//             default: null
//         },
//         resetPasswordExpires: {
//             type: Date,
//             default: null
//         },firstName: {
//             type: String,
//             default: "",
//         },
//         lastName: {
//             type: String,
//             default: "",
//         },
//         profileImage: {
//             type: String,
//             default: null,
//         },
//         profileComplete: {
//             type: Boolean,
//             default: false
//         }
//     }, 
//     {
//     timestamps: true
//     }
// );

// schema.methods.generateToken = function () {
//     try {
//       let userToken = jwt.sign({ _id: this._id }, process.env.Jwt_Sec);
//       return userToken;
//     } catch (error) {
//       console.log(error);
//     } 
// };

// export const User = mongoose.model("User", schema);





import jwt from "jsonwebtoken"; // Add this import
import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        contact:{
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: function(v) {
                    return /\d{10}/.test(v); // Validates for a 10-digit number
                },
                message: props => `${props.value} is not a valid contact number!`
            }
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: "user",
            enum: ["user", "admin", "instructor"] // Optional: restricts values
        },
        subscription: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Courses",
        }],
        // Fields for password reset
        resetPasswordToken: {
            type: String,
            default: null
        },
        resetPasswordExpires: {
            type: Date,
            default: null
        },
        firstName: {
            type: String,
            default: "",
        },
        lastName: {
            type: String,
            default: "",
        },
        profileImage: {
            type: String,
            default: null,
        },
        profileComplete: {
            type: Boolean,
            default: false
        }
    }, 
    {
        timestamps: true
    }
);
schema.methods.generateToken = function () {
    try {
      let userToken = jwt.sign({ _id: this._id }, process.env.Jwt_Sec);
      return userToken;
    } catch (error) {
      console.log(error);
    } 
};

export const User = mongoose.model("User", schema);
