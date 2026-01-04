export default function Experience({ jobs }: { jobs: any }) {
  return (
    <div style={{ color: "white", marginTop: 40 }}>
      <h3>DEBUG: Experience Component</h3>
      <pre
        style={{
          background: "#111",
          padding: 12,
          borderRadius: 8,
          fontSize: 12,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(jobs, null, 2)}
      </pre>
    </div>
  );
}
