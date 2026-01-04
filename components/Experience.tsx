type Job = {
  company: string;
  role?: string;
  from?: string;
  to?: string | null;
};

export default function Experience({ jobs }: { jobs: Job[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <div>
      <h3 style={titleStyle}>Experience</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {jobs.map((job, i) => (
          <div key={i} style={jobStyle}>
            <div style={{ fontWeight: 600 }}>{job.company}</div>
            {job.role && (
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {job.role}
              </div>
            )}
            {(job.from || job.to) && (
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {job.from || "—"} – {job.to || "Present"}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const titleStyle = {
  color: "#f3b130",
  marginBottom: 8,
};

const jobStyle = {
  background: "#111",
  padding: 12,
  borderRadius: 10,
  color: "#fff",
};
