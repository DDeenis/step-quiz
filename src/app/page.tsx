"use server";
import SignInPage from "@/components/pages/auth/SignInPage";
import { getSession } from "@/utils/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getSession(await headers());

  if (session) {
    return redirect("/home");
  }

  return <SignInPage />;
}
