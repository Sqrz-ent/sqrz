import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const headersList = await headers();
  const host = headersList.get("host")?.toLowerCase() || "";

  // Dashboard host → dashboard
  if (host.startsWith("dashboard.")) {
    redirect("/dashboard");
  }

  // Everything else (profiles, custom domains)
  // is handled by the (profiles) route group
  redirect("/");
}
