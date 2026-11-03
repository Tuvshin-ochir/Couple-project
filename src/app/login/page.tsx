import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Нэвтрэх" };

// Урилгын холбоос: /login?c=<хосын нэр> — хосын нэр нь урьдчилж бөглөгдөнө
export default async function LoginPage(props: PageProps<"/login">) {
  await connection();
  if (await readSession()) redirect("/");
  const c = (await props.searchParams).c;
  const handle = typeof c === "string" ? c.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) : "";
  return (
    <main className="auth">
      <LoginForm initialHandle={handle} />
    </main>
  );
}
