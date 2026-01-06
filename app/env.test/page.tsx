"use client";

export default function EnvTest() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Env test</h1>
      <pre>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "UNDEFINED"}
      </pre>
    </div>
  );
}
