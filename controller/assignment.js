import { Assignment } from "../models/assignment.js";
import { TryCatch } from "../middlewares/TryCatch.js";

export const submitAssignment = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;
  const { answers } = req.body; // answers: [{ questionIndex, answer }]
  const userId = req.user._id;

  // Find the assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  // Check if user has already submitted
  const existingSubmission = assignment.submissions.find(
    (sub) => sub.student.toString() === userId.toString()
  );
  if (existingSubmission) {
    return res.status(400).json({ message: "You have already submitted this assignment" });
  }

  // Evaluate answers
  const evaluatedAnswers = answers.map((ans) => {
    const question = assignment.questions[ans.questionIndex];
    let isCorrect = null;

    if (question.type === "mcq") {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      isCorrect = correctOption && ans.answer === correctOption.text;
    } else if (question.type === "true-false") {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      isCorrect = correctOption && ans.answer === correctOption.text;
    } else if (question.type === "free-text") {
      isCorrect = null; // Needs manual grading
    }

    return {
      questionIndex: ans.questionIndex,
      answer: ans.answer,
      isCorrect,
    };
  });

  // Calculate marks for auto-graded questions
  let totalMarks = 0;
  evaluatedAnswers.forEach((ans) => {
    if (ans.isCorrect === true) {
      totalMarks += assignment.questions[ans.questionIndex].maxMarks;
    }
  });

  // Store submission
  const submission = {
    student: userId,
    answers: evaluatedAnswers,
    marks: totalMarks, // Will be updated later for free-text grading
  };
  assignment.submissions.push(submission);

  await assignment.save();

  res.status(201).json({ message: "Assignment submitted successfully", submission });
});

export const getSubmissionResults = TryCatch(async (req, res) => {
  const { assignmentId } = req.params;
  const userId = req.user._id;

  // Find the assignment
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ message: "Assignment not found" });
  }

  // Find user's submission
  const submission = assignment.submissions.find(
    (sub) => sub.student.toString() === userId.toString()
  );
  if (!submission) {
    return res.status(404).json({ message: "No submission found for this assignment" });
  }

  // Prepare detailed results
  const results = submission.answers.map((ans) => {
    const question = assignment.questions[ans.questionIndex];
    let correctAnswer = null;

    if (question.type === "mcq" || question.type === "true-false") {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      correctAnswer = correctOption ? correctOption.text : null;
    }

    return {
      questionText: question.questionText,
      userAnswer: ans.answer,
      isCorrect: ans.isCorrect,
      correctAnswer,
      explanation: question.explanation || "No explanation provided",
      maxMarks: question.maxMarks,
    };
  });

  res.json({
    assignmentTitle: assignment.title,
    totalMarks: submission.marks,
    submittedAt: submission.submittedAt,
    results,
  });
});