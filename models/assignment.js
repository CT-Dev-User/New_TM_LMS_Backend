import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Courses",
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    questions: [
      {
        type: {
          type: String,
          enum: ["mcq", "free-text", "true-false"],
          required: true,
        },
        questionText: {
          type: String,
          required: true,
        },
        options: [
          {
            text: String,
            isCorrect: Boolean, // Used for MCQ and true-false
          },
        ],
        maxMarks: {
          type: Number,
          default: 1,
        },
        explanation: {
          type: String,
          default: "", // Explanation for the correct answer
        },
      },
    ],
    submissions: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        answers: [
          {
            questionIndex: Number,
            answer: String,
            isCorrect: {
              type: Boolean,
              default: null, // True for correct, false for incorrect, null for free-text
            },
          },
        ],
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        marks: {
          type: Number,
          default: null, // Total marks, updated manually or auto-calculated
        },
      },
    ],
  },
  { timestamps: true }
);

export const Assignment = mongoose.model("Assignment", assignmentSchema);