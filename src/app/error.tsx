"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootError() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ru");
  }, [router]);
  return null;
}
