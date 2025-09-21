import { NextRequest, NextResponse } from "next/server";
import Button from "@/models/buttonModel";
import Profile from "@/models/profileModel";
import Transaction from "@/models/transactionModel";
import { sendTransactionMail } from "@/lib/mail";
export async function POST(req: NextRequest) {
  const { buttonId, cryptoId, amount } = await req.json();
  const button = await Button.findById(buttonId);
  if (!button) {
    return NextResponse.json({ error: "Button not found" }, { status: 404 });
  }
  const user = await Profile.find({ cryptId: cryptoId });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  console.log(user);
  const transaction = await Transaction.create({
    from: user[0]?.email,
    to: button.merchantAddress,
    signature: "",
    buttonId: button._id,
    status: "pending",
    amount: amount,
  });
  button.transactions.push(transaction._id);
  await button.save();
  console.log("Transaction created:", transaction);
  await sendTransactionMail(user[0]?.email, amount, transaction._id);
  return NextResponse.json({
    transactionId: transaction._id,
    message: "Transaction created",
  });
}
