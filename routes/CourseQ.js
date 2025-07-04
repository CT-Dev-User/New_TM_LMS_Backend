
import express from 'express';
import { addAnswer, createQuestion, deleteAnswer, deleteQuestion, getCourseQuestions, voteQuestion } from '../controller/CourseQ.js';
import { isAuth } from '../middlewares/isAuth.js';
import { Question } from '../models/CourseQ.js';

const router = express.Router();

// Get all questions for a course
router.get('/course/:courseId/fetchquestions', isAuth, getCourseQuestions);

// Add this route to check all questions in the database
router.get('/questions/all', isAuth, async (req, res) => {
    try {
        const questions = await Question.find({});
        res.status(200).json({ 
            count: questions.length,
            questions: questions.map(q => ({
                id: q._id,
                title: q.title,
                course: q.course,
                askedBy: q.askedBy
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new question
router.post('/course/:courseId/question', isAuth, createQuestion);

// Vote on a question
router.put('/question/:id/vote', isAuth, voteQuestion);

// Delete a question
router.delete('/question/:id', isAuth, deleteQuestion);




// Add an answer to a question
router.post('/question/:id/answer', isAuth, addAnswer);

// Delete an answer from a question
router.delete('/question/:id/answer/:answerId', isAuth, deleteAnswer);



export default router;
