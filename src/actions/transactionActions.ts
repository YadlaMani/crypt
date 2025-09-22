"use server";
import Profile from "@/models/profileModel";
import Transaction from "@/models/transactionModel";

export async function getUserTransactions(userId: string) {
  try {
    const profile = (await Profile.findById(userId).lean()) as {
      email: string;
    } | null;
    if (!profile) {
      return { success: false, transaction: null };
    }

    const transactions = await Transaction.find({ from: profile.email })
      .sort({ time: -1 })
      .lean();

    for (let i = 0; i < transactions.length; i++) {
      if (
        Date.now() - new Date(transactions[i].time).getTime() >
          10 * 60 * 1000 &&
        transactions[i].status === "pending"
      ) {
        await Transaction.updateOne(
          { _id: transactions[i]._id },
          { $set: { status: "failed" } }
        );
        transactions[i].status = "failed";
      }
    }

    if (
      transactions.length > 0 &&
      Date.now() - new Date(transactions[0].time).getTime() < 10 * 60 * 1000
    ) {
      return {
        success: true,
        transaction: JSON.parse(JSON.stringify(transactions[0])),
      };
    }

    return {
      success: false,
      transaction: null,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: "Failed to fetch transactions",
      details: err instanceof Error ? err.message : err,
    };
  }
}

export async function getTransactionById(transactionId: string) {
  try {
    const transaction = await Transaction.findById(transactionId).populate(
      "buttonId"
    );
    if (!transaction) {
      return { success: false, transaction: null };
    }
    console.log(transaction);
    if (
      transaction.time &&
      Date.now() - new Date(transaction.time).getTime() > 10 * 60 * 1000 &&
      transaction.status === "pending"
    ) {
      await Transaction.updateOne(
        { _id: transaction._id },
        { $set: { status: "failed" } }
      );
      transaction.status = "failed";
    }
    if (transaction.status === "pending") {
      return {
        success: true,
        transaction: JSON.parse(JSON.stringify(transaction)),
      };
    }
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: "Failed to fetch transaction",
      details: err instanceof Error ? err.message : err,
    };
  }
}
