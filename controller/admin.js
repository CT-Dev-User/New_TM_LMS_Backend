import { TryCatch } from '../middlewares/TryCatch.js';
import { Courses } from '../models/courses.js';
import { Lecture } from '../models/lectures.js';
import { Meeting } from '../models/meetingData.js'; // Restored
import { Assignment } from '../models/assignment.js';
import { User } from '../models/user.js';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
};

const getPublicIdFromUrl = (url) => {
  const regex = /\/upload\/(?:v\d+\/)?(.+?)\.\w+$/;
  const match = url.match(regex);
  return match ? match[1] : null;
};


const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price, assignedTo } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'courses',
    resource_type: 'image',
  });

  if (assignedTo) {
    const instructor = await User.findById(assignedTo);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid instructor ID or user is not an instructor',
      });
    }
  }

  await Courses.create({
    title,
    description,
    category,
    createdBy,
    image: result.secure_url,
    duration,
    price,
    assignedTo: assignedTo || null,
  });

  res.status(201).json({ success: true, message: 'Course created successfully' });
});

const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'No course for this id' });

  const { title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'Video is required' });
  }

  const result = await uploadToCloudinary(file.buffer, {
    folder: 'lectures',
    resource_type: 'video',
  });

  const lecture = await Lecture.create({
    title,
    description,
    video: result.secure_url,
    course: course._id,
  });

  res.status(200).json({ message: 'Lecture added successfully', lecture });
});

const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

  const videoPublicId = getPublicIdFromUrl(lecture.video);
  if (videoPublicId) {
    await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
  }

  await lecture.deleteOne();
  res.json({ message: 'Lecture deleted' });
});

const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(
    lectures.map(async (lecture) => {
      const videoPublicId = getPublicIdFromUrl(lecture.video);
      if (videoPublicId) {
        await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
      }
    }),
  );

  const imagePublicId = getPublicIdFromUrl(course.image);
  if (imagePublicId) {
    await cloudinary.uploader.destroy(imagePublicId, { resource_type: 'image' });
  }

  await Lecture.deleteMany({ course: req.params.id });
  await course.deleteOne();
  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({ message: 'Course deleted' });
});

const getAllStats = TryCatch(async (req, res) => {
  const totalCourses = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = { totalCourses, totalLectures, totalUsers };
  res.json({ stats });
});

const getAllUser = TryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select('-password');
  res.json({ users });
});

const updateRole = TryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  const { role } = req.body;

  if (!user) {
    return res.status(400).json({ success: false, message: 'User not found' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only admins can update roles' });
  }

  if (!['user', 'admin', 'instructor'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified. Must be "user", "admin", or "instructor"',
    });
  }

  if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
    return res.status(403).json({ success: false, message: 'You cannot demote yourself from admin' });
  }

  user.role = role;
  await user.save();

  res.status(200).json({ success: true, message: `Role updated to ${role}` });
});

const createAssignment = TryCatch(async (req, res) => {
  const { courseId } = req.params;
  const { title, description, deadline, questions } = req.body;

  const course = await Courses.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role !== 'admin' && course.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Only the assigned instructor or admin can create assignments',
    });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'At least one question is required' });
  }

  for (const q of questions) {
    if (!['mcq', 'free-text', 'true-false'].includes(q.type)) {
      return res.status(400).json({ message: `Invalid question type: ${q.type}` });
    }
    if (!q.questionText) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    if (q.type === 'mcq' || q.type === 'true-false') {
      if (!q.options || q.options.length === 0) {
        return res.status(400).json({ message: `${q.type} questions require options` });
      }
      if (q.type === 'true-false' && q.options.length !== 2) {
        return res.status(400).json({ message: 'True/False questions must have exactly 2 options' });
      }
      const hasCorrect = q.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        return res.status(400).json({ message: `${q.type} questions must have at least one correct option` });
      }
    }
    if (q.maxMarks && q.maxMarks <= 0) {
      return res.status(400).json({ message: 'Max marks must be greater than 0' });
    }
  }

  const assignment = await Assignment.create({
    title,
    description,
    course: courseId,
    instructor: req.user._id,
    deadline: deadline ? new Date(deadline) : null,
    questions,
  });

  res.status(201).json({ success: true, message: 'Assignment created successfully', assignment });
});

// Get assignments for a course
const getAssignmentsByCourse = TryCatch(async (req, res) => {
  const { courseId } = req.params;

  const course = await Courses.findById(courseId);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const assignments = await Assignment.find({ course: courseId }).populate('instructor', 'name email');

  const filteredAssignments = assignments.map((assignment) => {
    if (req.user.role === 'instructor' || req.user.role === 'admin') {
      return assignment;
    }
    const studentSubmission = assignment.submissions.find(
      (sub) => sub.student.toString() === req.user._id.toString(),
    );
    return {
      ...assignment.toObject(),
      submissions: studentSubmission ? [studentSubmission] : [],
    };
  });

  res.status(200).json({ success: true, assignments: filteredAssignments });
});

// Submit an assignment
const submitAssignment = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;
  const { answers } = req.body;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (req.user.role !== 'user') {
    return res.status(403).json({ message: 'Only students can submit assignments' });
  }

  if (assignment.deadline && new Date() > assignment.deadline) {
    return res.status(400).json({ message: 'Submission deadline has passed' });
  }

  const existingSubmission = assignment.submissions.find(
    (sub) => sub.student.toString() === req.user._id.toString(),
  );
  if (existingSubmission) {
    return res.status(400).json({ message: 'You have already submitted this assignment' });
  }

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ message: 'Answers must be provided as an array' });
  }

  let totalMarks = 0;
  for (const answer of answers) {
    const question = assignment.questions[answer.questionIndex];
    if (!question) {
      return res.status(400).json({ message: 'Invalid question index' });
    }
    if (question.type === 'mcq' || question.type === 'true-false') {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption.text === answer.answer) {
        totalMarks += question.maxMarks || 1;
      }
    }
  }

  const submission = { student: req.user._id, answers, marks: totalMarks > 0 ? totalMarks : null };

  assignment.submissions.push(submission);
  await assignment.save();

  res.status(200).json({ success: true, message: 'Assignment submitted successfully', submission });
});

// Delete an assignment
const deleteAssignment = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'Only the instructor who created this assignment or an admin can delete it',
    });
  }

  await assignment.deleteOne();

  res.status(200).json({ success: true, message: 'Assignment deleted successfully' });
});

// Get assignment submissions
const getAssignmentSubmissions = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId).populate({
    path: 'submissions.student',
    select: 'name',
  });

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You are not authorized to view submissions for this assignment',
    });
  }

  const submissions = assignment.submissions.map((sub) => ({
    _id: sub._id,
    studentName: sub.student.name,
    submittedAt: sub.submittedAt,
    marks: sub.marks,
    answers: sub.answers.map((ans) => ({
      question: assignment.questions[ans.questionIndex].questionText,
      type: assignment.questions[ans.questionIndex].type,
      answer: ans.answer,
      maxMarks: assignment.questions[ans.questionIndex].maxMarks,
    })),
  }));

  res.status(200).json({ success: true, assignmentTitle: assignment.title, submissions });
});

// Update assignment submission marks
const updateSubmissionMarks = TryCatch(async (req, res) => {
  const { assignmentId, submissionId } = req.params;
  const { marks } = req.body;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  if (req.user.role !== 'admin' && assignment.instructor.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You are not authorized to update marks for this assignment',
    });
  }

  const submission = assignment.submissions.id(submissionId);
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  submission.marks = marks;
  await assignment.save();

  res.status(200).json({ success: true, message: 'Marks updated successfully' });
});

// Get lectures for a course
const getCourseLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role !== 'admin' && course.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You are not authorized to view lectures for this course',
    });
  }

  const lectures = await Lecture.find({ course: course._id });
  res.status(200).json({ success: true, lectures });
});

// Get students enrolled in a course
const getStudentsByCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (req.user.role !== 'admin' && course.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      message: 'You are not authorized to view students for this course',
    });
  }

  const students = await User.find({
    role: 'user',
    subscription: { $in: [course._id] },
  }).select('_id name email');

  res.status(200).json({ success: true, students });
});

// Get courses assigned to an instructor
const getInstructorCourses = TryCatch(async (req, res) => {
  const instructorId = req.user._id;

  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only instructors or admins can access this resource',
    });
  }

  const courses = await Courses.find({ assignedTo: instructorId }).select('_id title');

  res.status(200).json({ success: true, courses });
});

export {
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
  getInstructorCourses,
};