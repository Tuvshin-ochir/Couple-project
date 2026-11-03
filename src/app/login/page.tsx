import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { getSettings } from "@/lib/ctx";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default async function LoginPage() {
  await connection();
  const s = await getSettings();
  if (!s) redirect("/setup");
  if (await readSession(s.passwordHash)) redirect("/");
  return (
    <main className="auth">
      <LoginForm names={{ a: s.nameA, b: s.nameB }} />
    </main>
  );
}
