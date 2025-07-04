import mongoose from "mongoose";

const schema = new mongoose.Schema({
    platform: {
        type: String,
        required: [true, "Platform name is required"],
        trim: true
    },
    meetingDate: {
        type: Date,
        required: [true, "Meeting date is required"],
        set: value => new Date(value)
    },
    meetingTime: {
        type: String,
        required: [true, "Meeting time is required"],
        trim: true
    },
    meetingLink: {
        type: String,
        required: [true, "Meeting link is required"]
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    }
});

export const Meeting = mongoose.model("Meeting", schema);