const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ['Materials', 'Labor', 'Equipment', 'Transport', 'Other'], required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  vendor: String,
  receipt: String, // URL to receipt image
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);
