// import mongoose from "mongoose";
// import Payout from '../models/instructor.js';
// // Update the getPayoutSummary function to handle both 'processed' and 'approved' statuses
// export const getPayoutSummary = async (req, res) => {
//   try {
//     const pendingPayouts = await Payout.aggregate([
//       { $match: { instructorId: req.user._id, status: 'pending' } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]);

//     const totalPaidOut = await Payout.aggregate([
//       { $match: { instructorId: req.user._id, status: { $in: ['processed', 'approved'] } } },
//       { $group: { _id: null, total: { $sum: '$amount' } } }
//     ]);

//     const requestedAmount = await Payout.aggregate([
//       { $match: { instructorId: req.user._id, status: 'pending' } },
//       { $sort: { dateRequested: -1 } },
//       { $limit: 1 }
//     ]);

//     res.json({
//       pendingAmount: pendingPayouts[0]?.total || 0,
//       totalPayoutAmount: totalPaidOut[0]?.total || 0,
//       requestedAmount: requestedAmount[0]?.amount || 0,
//       lastRequestDate: requestedAmount[0]?.dateRequested || null
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// export const requestWithdrawal = async (req, res) => {
//   try {
//     const { amount } = req.body;
    
//     const newPayout = new Payout({
//       instructorId: req.user._id,
//       amount,
//       status: 'pending'
//     });

//     await newPayout.save();
//     res.status(201).json(newPayout);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// export const getPayoutHistory = async (req, res) => {
//   try {
//     const payouts = await Payout.find({ instructorId: req.user._id })
//       .sort({ dateRequested: -1 });
//     res.json(payouts);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// export const deleteWithdrawalRequest = async (req, res) => {
//     try {
//         const payoutId = req.params.id;
//         const userId = req.user._id;  // Logged-in user ID

//         console.log("Received request to delete payout:", payoutId);
//         console.log("User ID:", userId);

//         // Check if the ID is a valid MongoDB ObjectId
//         if (!mongoose.Types.ObjectId.isValid(payoutId)) {
//             return res.status(400).json({ message: "Invalid payout ID format" });
//         }

//         // Find the payout request in the database
//         const payout = await Payout.findOne({ _id: payoutId });

//         if (!payout) {
//             return res.status(404).json({ message: "Payout request not found" });
//         }

//         console.log("Payout found:", payout);

//         // Ensure the request belongs to the logged-in user
//         if (payout.instructorId.toString() !== userId.toString()) {
//             return res.status(403).json({ message: "Unauthorized: Cannot delete another user's payout request" });
//         }

//         // Ensure the payout is still pending
//         if (payout.status !== "pending") {
//             return res.status(400).json({ message: "Cannot delete a processed payout request" });
//         }

//         // Delete the payout request
//         await Payout.deleteOne({ _id: payoutId });

//         res.json({ message: "Withdrawal request deleted successfully!" });

//     } catch (error) {
//         console.error("Error deleting payout request:", error);
//         res.status(500).json({ message: "Server error, please try again" });
//     }
// };



import mongoose from "mongoose";
import Payout from '../models/instructor.js';


export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;

    const newPayout = new Payout({
      instructorId: req.user._id,
      amount,
      status: 'pending'
    });

    await newPayout.save();
    res.status(201).json(newPayout);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const getPayoutSummary = async (req, res) => {
  try {
    const pendingPayouts = await Payout.aggregate([
      { $match: { instructorId: req.user._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalPaidOut = await Payout.aggregate([
      { $match: { instructorId: req.user._id, status: { $in: ['processed', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const requestedAmount = await Payout.aggregate([
      { $match: { instructorId: req.user._id, status: 'pending' } },
      { $sort: { dateRequested: -1 } },
      { $limit: 1 }
    ]);

    res.json({
      pendingAmount: pendingPayouts[0]?.total || 0,
      totalPayoutAmount: totalPaidOut[0]?.total || 0,
      requestedAmount: requestedAmount[0]?.amount || 0,
      lastRequestDate: requestedAmount[0]?.dateRequested || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getPayoutHistory = async (req, res) => {
  try {
    const payouts = await Payout.find({ instructorId: req.user._id })
      .sort({ dateRequested: -1 });
    res.json(payouts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const deleteWithdrawalRequest = async (req, res) => {
  try {
    const payoutId = req.params.id;
    const userId = req.user._id;  // Logged-in user ID

    console.log("Received request to delete payout:", payoutId);
    console.log("User ID:", userId);

    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
      return res.status(400).json({ message: "Invalid payout ID format" });
    }

    // Find the payout request in the database
    const payout = await Payout.findOne({ _id: payoutId });

    if (!payout) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    console.log("Payout found:", payout);

    // Ensure the request belongs to the logged-in user
    if (payout.instructorId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized: Cannot delete another user's payout request" });
    }

    // Ensure the payout is still pending
    if (payout.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete a processed payout request" });
    }

    // Instead of deleting, mark as deleted
    payout.status = "deleted";
    payout.dateDeleted = new Date();
    await payout.save();

    res.json({ message: "Withdrawal request deleted successfully!" });

  } catch (error) {
    console.error("Error deleting payout request:", error);
    res.status(500).json({ message: "Server error, please try again" });
  }
};
