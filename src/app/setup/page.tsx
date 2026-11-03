import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/ctx";
import SetupForm from "./SetupForm";

export const metadata: Metadata = { title: "Эхлэх" };

export default async function SetupPage() {
  await connection();
  if (await getSettings()) redirect("/login");
  return (
    <main className="auth">
      <SetupForm />
    </main>
  );
}
