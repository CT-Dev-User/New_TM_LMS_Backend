import express from 'express';
import { forgotPassword, loginUser, logout, myProfile, register, resetPassword, updateProfile, verifyUser } from '../controller/user.js';
import { submitAssignment, getSubmissionResults } from '../controller/assignment.js';
import { isAuth } from '../middlewares/isAuth.js';
import { getMeetings } from '../controller/meeting.js';

const router = express.Router();

// Existing user routes
router.post('/user/register', register);
router.post('/user/verify', verifyUser);
router.post('/user/login', loginUser);
router.post('/user/logout', logout); // New logout route
router.get('/user/me', isAuth, myProfile);
router.get('/lecture/:courseId/meetings', isAuth, getMeetings);
router.post('/user/forgot-password', forgotPassword);
router.post('/user/reset-password', resetPassword);
router.put('/user/update-profile', isAuth, updateProfile);

// New assignment routes
router.post('/assignment/:assignmentId/submit', isAuth, submitAssignment);
router.get('/assignment/:assignmentId/results', isAuth, getSubmissionResults);

export default router;