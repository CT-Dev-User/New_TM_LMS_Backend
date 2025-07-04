import { instance } from '../index.js';
import { TryCatch } from '../middlewares/TryCatch.js';
import { Courses } from '../models/courses.js';
import { Lecture } from '../models/lectures.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/user.js';
import crypto from 'crypto';

export const getAllCourses = TryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.json({ courses });
});

export const getSingleCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  res.json({ course });
});

export const fetchLectures = TryCatch(async (req, res) => {
  const courseId = req.params.id;
  const lectures = await Lecture.find({ course: courseId });
  const user = await User.findById(req.user._id);

  if (user.role === 'admin') {
    return res.json({ lectures });
  }

  if (user.role === 'instructor') {
    const course = await Courses.findById(courseId);
    if (!course || course.assignedTo?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }
    return res.json({ lectures });
  }

  if (!Array.isArray(user.subscription) || !user.subscription.map(id => id.toString()).includes(courseId)) {
    return res.status(400).json({ message: 'You have not subscribed to this course' });
  }

  if (lectures.length === 0) {
    return res.status(404).json({ message: 'No lectures found for this course' });
  }

  res.json({ lectures });
});

export const fetchLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) return res.status(404).json({ message: 'Lecture not found' });

  const user = await User.findById(req.user._id);
  const course = await Courses.findById(lecture.course);

  if (user.role === 'admin') return res.json({ lecture });

  if (user.role === 'instructor') {
    if (!course || course.assignedTo?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this course' });
    }
    return res.json({ lecture });
  }

  if (!Array.isArray(user.subscription) || !user.subscription.map(id => id.toString()).includes(lecture.course.toString())) {
    return res.status(400).json({ message: 'You have not subscribed to this course' });
  }

  res.json({ lecture });
});

export const getMyCourses = TryCatch(async (req, res) => {
  let courses = [];

  if (req.user.role === 'admin') {
    courses = await Courses.find();
  } else if (req.user.role === 'instructor') {
    courses = await Courses.find({ assignedTo: req.user._id });
  } else if (req.user.role === 'user') {
    courses = await Courses.find({ _id: { $in: req.user.subscription || [] } });
  }

  res.json({ courses });
});

export const checkout = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const course = await Courses.findById(req.params.id);

  if (!course) return res.status(404).json({ message: 'Course not found' });

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({ message: 'Already subscribed to this course' });
  }

  const options = {
    amount: course.price * 100,
    currency: 'INR',
  };

  const order = await instance.orders.create(options);

  res.status(200).json({ order, course });
});

export const paymentVerification = TryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    await Payment.create({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    const user = await User.findById(req.user._id);
    const course = await Courses.findById(req.params.id);

    if (!user.subscription.includes(course._id)) {
      user.subscription.push(course._id);
      await user.save();
    }

    res.status(200).json({ message: 'Course Purchased Successfully', success: true });
  } else {
    res.status(400).json({ message: 'Payment Failed' });
  }
});
