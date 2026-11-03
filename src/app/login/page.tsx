import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";
import { og, SITE_NAME } from "@/lib/site";
import LoginForm from "./LoginForm";

// Урилгын холбоос Messenger г.м-д хуваалцагдахад тусгай карт гарна
export async function generateMetadata(props: PageProps<"/login">): Promise<Metadata> {
  const { c } = await props.searchParams;
  if (typeof c !== "string" || !c) return { title: "Нэвтрэх" };
  return {
    title: "Урилга",
    openGraph: og("Хайрт чинь чамайг урьж байна", `${SITE_NAME} — хоёулангийн жижигхэн гэрт нэгдээрэй. Хосын нууц үгээ хайртаасаа асуугаарай.`),
  };
}

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
