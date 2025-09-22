import { fetchProfileAction } from "@/actions/userActions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import MainDashboard from "../components/MainDashboard";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const res = await fetchProfileAction(user.id);
  const profileInfo = res.success ? await res.profile : null;
  if (user && !profileInfo) redirect("/onboard");

  return <MainDashboard profileId={profileInfo._id.toString()} />;
}
