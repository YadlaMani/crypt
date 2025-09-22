"use server";
import Profile from "@/models/profileModel";
import Transaction from "@/models/transactionModel";
export async function getUserTransactions(userId: string) {
  try {
    const profile = await Profile.findById(userId);
    const transactions = await Transaction.find({ from: profile.email }).sort({
      time: -1,
    });
    if (transactions[0].time - Date.now() < 10 * 60 * 1000) {
      return {
        success: true,
        transaction: transactions[0],
      };
    }
    return {};
  } catch (err) {
    console.error(err);
    return {};
  }
}
