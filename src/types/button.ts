export type ButtonType = {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  tokenAddress?: string;
  chainId: string;
  merchantAddress: string;
  isActive: boolean;
};
