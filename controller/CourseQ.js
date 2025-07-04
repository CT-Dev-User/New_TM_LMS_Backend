import mongoose from 'mongoose';
import { Question } from '../models/CourseQ.js';
import { User } from '../models/user.js';


export const createQuestion = async (req, res) => {
    try {
        const { courseId } = req.params; // Extract courseId from route params
        const { title, details } = req.body;
        
        if (!title || !details) {
            return res.status(400).json({ message: "Title and details are required" });
        }
        
        // Make sure courseId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: "Invalid course ID format" });
        }
        
        const user = await User.findById(req.user._id);
        
        const question = await Question.create({
            title,
            details,
            questionText: title, // For backward compatibility
            askedBy: req.user._id,
            course: courseId, // Save the course ID
            authorName: user.name // Add author name for easier display
        });
        
        res.status(201).json({ 
            message: "Question submitted", 
            question: {
                ...question._doc,
                authorName: user.name,
                answers: []
            } 
        });
    } catch (error) {
        // console.error("Error creating question:", error);
        res.status(500).json({ message: error.message });
    }
};


////////////////////////////////get Questions for a course///////////////


export const getCourseQuestions = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // console.log("Fetching questions for course:", courseId);
        
        // Make sure courseId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ message: "Invalid course ID format" });
        }
        
        const questions = await Question.find({ course: courseId })
            .populate('askedBy', 'name')
            .populate('answers.authorId', 'name role')
            .sort({ createdAt: -1 });
            
        // console.log("Found questions:", questions.length);
        
        // Format the questions for the frontend
        const formattedQuestions = questions.map(q => ({
            _id: q._id,
            title: q.title || q.questionText,
            details: q.details || "",
            author: q.askedBy?._id || q.askedBy,
            authorName: q.authorName || (q.askedBy?.name || "Unknown"),
            createdAt: q.createdAt,
            votes: q.votes || 0,
            answers: (q.answers || []).map(a => ({
                _id: a._id,
                content: a.content,
                authorId: a.authorId?._id || a.authorId,
                authorName: a.authorName || (a.authorId?.name || "Unknown"),
                isInstructor: a.isInstructor || (a.authorId?.role === 'instructor' || a.authorId?.role === 'admin'),
                createdAt: a.createdAt
            }))
        }));
        
        res.status(200).json({ questions: formattedQuestions });
    } catch (error) {
        // console.error("Error fetching questions:", error);
        res.status(500).json({ message: error.message });
    }
};



// Renamed from answerQuestion to addAnswer to match routes
export const addAnswer = async (req, res) => {
    try {
        const { content } = req.body;
        const { id } = req.params;

        if (!content) {
            return res.status(400).json({ message: "Answer content is required" });
        }

        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        const user = await User.findById(req.user._id);
        const isInstructor = user.role === 'instructor' || user.role === 'admin';

        const answer = {
            content,
            authorId: req.user._id,
            authorName: user.name,
            isInstructor,
            createdAt: new Date()
        };

        question.answers = question.answers || [];
        question.answers.push(answer);
        await question.save();

        res.status(200).json({ 
            message: "Answer submitted", 
            answer: {
                ...answer,
                _id: question.answers[question.answers.length - 1]._id
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


/////////////////////////vote on a question///////////////////////
export const voteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { increment } = req.body;
        
        // Validate increment is either 1 or -1
        if (increment !== 1 && increment !== -1) {
            return res.status(400).json({ message: "Invalid vote increment" });
        }
        
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        
        question.votes = (question.votes || 0) + increment;
        await question.save();
        
        res.status(200).json({ message: "Vote recorded", votes: question.votes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


////////////////////////delete a question///////////////////////
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        
        // Only allow the author or admin to delete
        if (question.askedBy.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized to delete this question" });
        }
        
        await Question.findByIdAndDelete(id);
        
        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Keep these for backward compatibility if needed
export const getUnansweredQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ answerText: null }).populate('askedBy', 'name');
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllAnsweredQuestions = async (req, res) => {
    try {
        const questions = await Question.find({ answerText: { $ne: null } })
            .populate('askedBy', 'name')
            .populate('answeredBy', 'name');

        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//////////////////////////delete an answer///////////////////////
export const deleteAnswer = async (req, res) => {
    try {
        const { id, answerId } = req.params;
        
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        
        // Find the answer
        const answerIndex = question.answers.findIndex(a => a._id.toString() === answerId);
        
        if (answerIndex === -1) {
            return res.status(404).json({ message: "Answer not found" });
        }
        
        const answer = question.answers[answerIndex];
        
        // Check if user is authorized to delete (answer author, admin, or instructor)
        if (answer.authorId.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin' && req.user.role !== 'instructor') {
            return res.status(403).json({ message: "Not authorized to delete this answer" });
        }
        
        // Remove the answer from the array
        question.answers.splice(answerIndex, 1);
        await question.save();
        
        res.status(200).json({ message: "Answer deleted successfully" });
    } catch (error) {
        // console.error("Error deleting answer:", error);
        res.status(500).json({ message: error.message });
    }
};
