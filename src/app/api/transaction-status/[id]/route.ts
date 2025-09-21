import { NextResponse, NextRequest } from "next/server";
import connectToDB from "@/database";
import Transaction from "@/models/transactionModel";

export async function GET(req: NextRequest) {
  const id = req.url.split("/").pop();
  console.log(id);

  try {
    await connectToDB();
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    console.log(transaction);
    return NextResponse.json({ status: transaction.status });
  } catch (err) {
    console.error("Error fetching transaction status:", err);
    return NextResponse.json(
      { error: "Failed to fetch transaction status" },
      { status: 500 }
    );
  }
}
