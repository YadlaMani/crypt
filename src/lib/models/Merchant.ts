import mongoose, { Schema, Document } from 'mongoose';

export interface IMerchant extends Document {
  clerkId: string;
  email: string;
  name: string;
  walletAddress?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema<IMerchant>({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  walletAddress: { type: String },
  webhookUrl: { type: String },
  webhookSecret: { type: String },
}, {
  timestamps: true,
});

export default mongoose.models.Merchant || mongoose.model<IMerchant>('Merchant', MerchantSchema);
