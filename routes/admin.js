import express from 'express';
import {
  addLectures,
  createAssignment,
  createCourse,
  deleteAssignment,
  deleteCourse,
  deleteLecture,
  getAllStats,
  getAllUser,
  getAssignmentsByCourse,
  getAssignmentSubmissions,
  submitAssignment,
  updateRole,
  updateSubmissionMarks,
  getCourseLectures,
  getStudentsByCourse,
  getInstructorCourses, // Added
} from '../controller/admin.js';
import {
  createMeeting,
  deleteMeeting,
  getMeetings,
  updateMeeting,
} from '../controller/meeting.js';
import { isAdmin, isAuth, isInstructorOrAdmin } from '../middlewares/isAuth.js';
import { uploadFiles } from '../middlewares/multer.js';
import Payout from '../models/instructor.js';
import { Courses } from '../models/courses.js';
import { User } from '../models/user.js';
import mongoose from 'mongoose';

const router = express.Router();

// Helper to validate MongoDB ObjectID
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Admin-only routes (create/delete courses, lectures, meetings)
router.post('/course/new', isAuth, isAdmin, uploadFiles, async (req, res) => {
  const { title, description, category, createdBy, duration, price, assignedTo } = req.body;
  if (!title || !description || !category || !createdBy || !duration || !price) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided' });
  }
  if (isNaN(duration) || isNaN(price)) {
    return res.status(400).json({ success: false, message: 'Duration and price must be numbers' });
  }
  if (assignedTo && !isValidObjectId(assignedTo)) {
    return res.status(400).json({ success: false, message: 'Invalid instructor ID' });
  }
  createCourse(req, res);
});

router.post('/course/:id', isAuth, isAdmin, uploadFiles, (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  addLectures(req, res);
});

router.delete('/course/:id', isAuth, isAdmin, (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  deleteCourse(req, res);
});

router.delete('/lecture/:id', isAuth, isAdmin, (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid lecture ID' });
  }
  deleteLecture(req, res);
});

router.get('/course/:id/lectures', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  getCourseLectures(req, res);
});

router.post('/course/:courseId/meeting', isAuth, isAdmin, (req, res) => {
  if (!isValidObjectId(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  createMeeting(req, res);
});

router.post('/lecture/:lectureId/meeting', isAuth, isAdmin, (req, res) => {
  if (!isValidObjectId(req.params.lectureId)) {
    return res.status(400).json({ success: false, message: 'Invalid lecture ID' });
  }
  createMeeting(req, res);
});

router.delete('/course/:courseId/meeting/:meetingId', isAuth, isAdmin, (req, res) => {
  if (!isValidObjectId(req.params.courseId) || !isValidObjectId(req.params.meetingId)) {
    return res.status(400).json({ success: false, message: 'Invalid course or meeting ID' });
  }
  deleteMeeting(req, res);
});

// Instructor or Admin routes (viewing stats, users, updating meetings, assignments)
router.get('/stats', isAuth, isInstructorOrAdmin, getAllStats);
router.get('/users', isAuth, isInstructorOrAdmin, getAllUser);
router.put('/meeting/:meetingId', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.meetingId)) {
    return res.status(400).json({ success: false, message: 'Invalid meeting ID' });
  }
  updateMeeting(req, res);
});
router.get('/course/:courseId/meetings', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  getMeetings(req, res);
});

// Assignment routes
router.post('/course/:courseId/assignment', isAuth, isInstructorOrAdmin, (req, res) => {
  const { title, description, questions, deadline } = req.body;
  if (!isValidObjectId(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  if (!title || !description || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ success: false, message: 'Title, description, and at least one question are required' });
  }
  if (deadline && isNaN(Date.parse(deadline))) {
    return res.status(400).json({ success: false, message: 'Invalid deadline format' });
  }
  createAssignment(req, res);
});

router.get('/course/:courseId/assignments', isAuth, (req, res) => {
  if (!isValidObjectId(req.params.courseId)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  getAssignmentsByCourse(req, res);
});

router.post('/assignment/:assignmentId/submit', isAuth, (req, res) => {
  const { answers } = req.body;
  if (!isValidObjectId(req.params.assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
  }
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ success: false, message: 'Answers must be a non-empty array' });
  }
  submitAssignment(req, res);
});

router.delete('/assignment/:assignmentId', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
  }
  deleteAssignment(req, res);
});

// Submission management routes
router.get('/assignment/:assignmentId/submissions', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment ID' });
  }
  getAssignmentSubmissions(req, res);
});

router.put('/assignment/:assignmentId/submission/:submissionId', isAuth, isInstructorOrAdmin, (req, res) => {
  const { marks } = req.body;
  if (!isValidObjectId(req.params.assignmentId) || !isValidObjectId(req.params.submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment or submission ID' });
  }
  if (marks === undefined || isNaN(marks)) {
    return res.status(400).json({ success: false, message: 'Marks must be a number' });
  }
  updateSubmissionMarks(req, res);
});

// Role update (admin only)
router.put('/user/:id', isAuth, isAdmin, (req, res) => {
  const { role } = req.body;
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID' });
  }
  if (!['user', 'admin', 'instructor'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  updateRole(req, res);
});

// Route for assigning/de-assigning instructors
router.put('/course/:id/assign', isAuth, isAdmin, async (req, res) => {
  try {
    const { instructorId } = req.body;
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    const course = await Courses.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (instructorId) {
      if (!isValidObjectId(instructorId)) {
        return res.status(400).json({ success: false, message: 'Invalid instructor ID' });
      }
      const instructor = await User.findById(instructorId);
      if (!instructor || instructor.role !== 'instructor') {
        return res.status(400).json({
          success: false,
          message: 'Invalid instructor ID or user is not an instructor',
        });
      }
      course.assignedTo = instructorId;
    } else {
      course.assignedTo = null; // De-assign instructor
    }

    await course.save();
    res.status(200).json({
      success: true,
      message: 'Course assignment updated successfully',
    });
  } catch (error) {
    console.error('Error updating course assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Withdrawal request routes
router.get('/withdrawal-requests', isAuth, isAdmin, async (req, res) => {
  try {
    const requests = await Payout.find()
      .populate('instructorId', 'name email')
      .sort({ dateRequested: -1 });

    const formattedRequests = requests.map((req) => ({
      _id: req._id,
      instructorId: req.instructorId ? req.instructorId._id : null,
      instructorName: req.instructorId ? req.instructorId.name : 'Unknown',
      instructorEmail: req.instructorId ? req.instructorId.email : 'Unknown',
      amount: req.amount,
      status: req.status,
      dateRequested: req.dateRequested,
      dateProcessed: req.dateProcessed,
    }));

    res.status(200).json({ success: true, requests: formattedRequests });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message,
    });
  }
});

router.put('/withdrawal-requests/:id', isAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal request ID' });
    }
    if (!['pending', 'processed', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: pending, processed, approved, rejected',
      });
    }

    const withdrawalRequest = await Payout.findById(id);
    if (!withdrawalRequest) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    withdrawalRequest.status = status;
    if (withdrawalRequest.status !== 'pending' && !withdrawalRequest.dateProcessed) {
      withdrawalRequest.dateProcessed = new Date();
    }

    await withdrawalRequest.save();
    res.status(200).json({
      success: true,
      message: `Withdrawal request ${
        status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'
      } successfully`,
    });
  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update withdrawal request',
      error: error.message,
    });
  }
});

// Instructor-specific routes
router.get('/course/:id/students', isAuth, isInstructorOrAdmin, (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid course ID' });
  }
  getStudentsByCourse(req, res);
});

router.get('/instructor/courses', isAuth, isInstructorOrAdmin, getInstructorCourses);

export default router;