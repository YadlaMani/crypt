export type ButtonType = {
  _id: string;
  name: string;
  description?: string;
  amountUsd: number; // Amount in USD
  tokenAddress?: string;
  chainId: string[];
  merchantAddress: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
