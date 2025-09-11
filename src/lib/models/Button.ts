import mongoose, { Schema, Document } from 'mongoose';

export interface IButton extends Document {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  amount: string; // In wei for ETH or smallest unit for tokens
  tokenAddress?: string; // For ERC-20 tokens, undefined for ETH
  chainId: number;
  merchantAddress: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ButtonSchema = new Schema<IButton>({
  id: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  amount: { type: String, required: true },
  tokenAddress: { type: String },
  chainId: { type: Number, required: true },
  merchantAddress: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

export default mongoose.models.Button || mongoose.model<IButton>('Button', ButtonSchema);
