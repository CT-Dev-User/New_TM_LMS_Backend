import mongoose from 'mongoose';
// Update the status enum to include 'approved'
const payoutSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'approved', 'rejected','deleted'],
    default: 'pending'
  },
  paymentType: {
    type: String,
    default: 'UPI'
  },
  dateRequested: {
    type: Date,
    default: Date.now
  },
  dateProcessed: Date,
  dateDeleted: Date
});

export default mongoose.model('Payout', payoutSchema);
