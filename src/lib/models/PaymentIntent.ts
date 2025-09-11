import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentIntent extends Document {
  id: string;
  buttonId: string;
  amount: string;
  tokenAddress?: string;
  chainId: number;
  merchantAddress: string;
  customerAddress?: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}

const PaymentIntentSchema = new Schema<IPaymentIntent>({
  id: { type: String, required: true, unique: true },
  buttonId: { type: String, required: true },
  amount: { type: String, required: true },
  tokenAddress: { type: String },
  chainId: { type: Number, required: true },
  merchantAddress: { type: String, required: true },
  customerAddress: { type: String },
  transactionHash: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'confirmed', 'failed'],
    default: 'pending'
  },
  confirmedAt: { type: Date },
}, {
  timestamps: true,
});

export default mongoose.models.PaymentIntent || mongoose.model<IPaymentIntent>('PaymentIntent', PaymentIntentSchema);
