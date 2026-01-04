export default function Experience({ jobs }: { jobs: any[] }) {
  return (
    <pre
      style={{
        color: "white",
        background: "#111",
        padding: 12,
        borderRadius: 8,
        fontSize: 12,
        overflowX: "auto",
      }}
    >
      {JSON.stringify(jobs, null, 2)}
    </pre>
  );
}
