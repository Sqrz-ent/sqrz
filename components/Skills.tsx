export default function Skills({ skills }: { skills: any[] }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;

  return (
    <div>
      <h3 style={titleStyle}>Skills</h3>

      <div style={skillsWrap}>
        {skills.map((item, i) => {
          // try all common Xano relation patterns
          const label =
            item?.skills?.task ||
            item?.skill?.task ||
            item?.skills_id?.task ||
            item?.task;

          if (!label) return null;

          return (
            <span key={i} style={chipStyle}>
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* styles */
const titleStyle = {
  color: "#f3b130",
  marginBottom: 8,
};

const skillsWrap = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
};

const chipStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#111",
  border: "1px solid #333",
  fontSize: 13,
  color: "#fff",
};
