import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    askedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    authorName: String,
    votes: {
        type: Number,
        default: 0
    },
    answers: [{
        content: String,
        authorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        authorName: String,
        isInstructor: Boolean,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    answerText: {
        type: String,
        default: null
    },
    answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

export const Question = mongoose.model('Question', questionSchema);
