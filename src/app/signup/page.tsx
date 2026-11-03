import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "Хосоо бүртгүүлэх" };

export default async function SignupPage() {
  await connection();
  if (await readSession()) redirect("/");
  return (
    <main className="auth">
      <SignupForm />
    </main>
  );
}
