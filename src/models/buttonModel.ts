import mongoose from "mongoose";

const ButtonSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  amountUsd: { type: Number, required: true }, // Store amount in USD
  chainId: [{ type: String, required: true }],
  merchantAddress: { type: String, required: true },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true // Automatically add createdAt and updatedAt
});
const Button =
  mongoose.models?.Button || mongoose.model("Button", ButtonSchema);
export default Button;
