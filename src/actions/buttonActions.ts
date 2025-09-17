"use server";
import connectToDB from "@/database";
import Button from "@/models/buttonModel";

export async function getUserButtons(userId: string) {
  try {
    await connectToDB();
    const buttons = await Button.find({ userId });
    return {
      success: true,
      buttons: buttons,
    };
  } catch (err) {
    console.error("Error fetching buttons:", err);
    return { succes: false, error: "Failed to fetch buttons", details: err };
  }
}

export async function createButton(data: {
  name: string;
  description: string;
  amount: number;
  tokenAddress: string;
  chainId: string;
  merchantAddress: string;
  userId: string;
}) {
  console.log(data);
  try {
    await connectToDB();

    const newButton = new Button({
      ...data,
      isActive: true,
    });

    await newButton.save();

    return {
      success: true,
      message: "Button created successfully",
      button: newButton,
    };
  } catch (err) {
    console.error("Error creating button:", err);
    return {
      success: false,
      message: "Failed to create button",
      details: err,
    };
  }
}

export async function getButtonById(buttonId: string) {
  connectToDB();
  try {
    const button = await Button.findById(buttonId);
    if (!button) {
      return {
        success: false,
        message: "Invalid id",
      };
    }
    return {
      success: true,
      button: button,
      message: "Button fetched successfully",
    };
  } catch (err) {
    return {
      success: false,
      message: "Button id is invalid or something went wrong",
      details: err,
    };
  }
}
