import mongoose from "mongoose";
const TransactionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  signature: { type: String, required: true },
  time: { type: Date, default: Date.now },
  buttonId: { type: mongoose.Schema.Types.ObjectId, ref: "Button" },
});
const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", TransactionSchema);
export default Transaction;
