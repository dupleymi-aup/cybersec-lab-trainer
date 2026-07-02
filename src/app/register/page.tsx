import { redirect } from "@/routing";

export default function RegisterRedirect() {
  redirect({ href: "/register", locale: "ru" });
}
