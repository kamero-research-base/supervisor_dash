// app/auth/login/page.tsx or pages/auth/login.tsx
import LoginForm from "@/app/components/auth/login";
import Head from "next/head";

export default function LoginPage() {
  return (
    <>
      <Head>
        <title>Login - Kamero Research Base</title>
      </Head>
      <LoginForm />
    </>);
}
