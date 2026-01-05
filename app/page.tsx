import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default function RootPage() {
  const host = headers().get("host")?.toLowerCase() || "";

  // Dashboard host → dashboard
  if (host.startsWith("dashboard.")) {
    redirect("/dashboard");
  }

  // Everything else (profiles, custom domains)
  // must be handled by the profiles route group
  redirect("/");
}
