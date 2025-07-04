import { TryCatch } from "../middlewares/TryCatch.js";
import { Meeting } from "../models/meetingData.js";

export const createMeeting = TryCatch(async (req, res) => {
    const { courseId } = req.params; // Extract courseId from the route
    const { platform, meetingDate, meetingTime, meetingLink } = req.body;

    if (!courseId || !platform || !meetingDate || !meetingTime || !meetingLink) {
        return res.status(400).json({
            success: false,
            message: "All fields are required (courseId, platform, meetingDate, meetingTime, meetingLink)",
        });
    }

    // Convert date string to Date object
    const formattedDate = new Date(meetingDate);
    
    // Check if date is valid
    if (isNaN(formattedDate)) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format. Please use YYYY-MM-DD format",
        });
    }

    const meeting = await Meeting.create({ 
        platform, 
        meetingDate: formattedDate,
        meetingTime, 
        meetingLink,
        course: courseId // This ensures the meeting is linked to a specific course
    });

    res.status(201).json({
        success: true,
        message: "Meeting created successfully for the course",
        meeting
    });
});

export const updateMeeting = TryCatch(async (req, res) => {
    const { id } = req.params;
    const { platform, meetingDate, meetingTime, meetingLink } = req.body;

    if (!platform || !meetingDate || !meetingTime || !meetingLink) {
        return res.status(400).json({
            success: false,
            message: "All fields are required (platform, meetingDate, meetingTime, meetingLink)",
        });
    }

    // Convert date string to Date object
    const formattedDate = new Date(meetingDate);
    
    // Check if date is valid
    if (isNaN(formattedDate)) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format. Please use YYYY-MM-DD format",
        });
    }

    const meeting = await Meeting.findByIdAndUpdate(id, {
        platform,
        meetingDate: formattedDate,
        meetingTime,
        meetingLink
    }, { new: true, runValidators: true });

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: "Meeting not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Meeting updated successfully",
        meeting
    });
});

export const getMeetings = TryCatch(async (req, res) => {
    const { courseId } = req.params; // Fetch meetings for a specific course
    const meetings = await Meeting.find({ course: courseId })
        .sort({ meetingDate: 1, meetingTime: 1 }); // Sort by date and time ascending

    res.status(200).json({
        success: true,
        count: meetings.length,
        meetings
    });
});

export const deleteMeeting = TryCatch(async (req, res) => {
    const { courseId, meetingId } = req.params;
    const meeting = await Meeting.findOneAndDelete({ _id: meetingId, course: courseId });

    if (!meeting) {
        return res.status(404).json({
            success: false,
            message: "Meeting not found or doesn't belong to this course"
        });
    }

    res.status(200).json({
        success: true,
        message: "Meeting deleted successfully"
    });
});