"use server";
import connectToDB from "@/database";
import Profile from "@/models/profileModel";
import { NextResponse } from "next/server";
export async function fetchProfileAction(id: string) {
  await connectToDB();
  const profile = await Profile.findOne({ userId: id });
  if (!profile) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(profile, { status: 200 });
}

export async function createProfileAction(
  userId: string,
  email: string,
  cryptId: string,
  username: string
) {
  try {
    await connectToDB();
    const newProfile = new Profile({ userId, email, cryptId, username });
    await newProfile.save();

    return { message: "Profile created successfully", success: true };
  } catch (err) {
    return {
      error: "Failed to create profile",
      details: err,
      success: false,
    };
  }
}
