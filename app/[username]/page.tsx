import { notFound } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Profile: {username}</h1>
    </main>
  );
}
