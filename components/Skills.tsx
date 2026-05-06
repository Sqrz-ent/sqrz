export default function Skills({ skills }: { skills: any[] }) {
  if (!Array.isArray(skills) || skills.length === 0) return null;

  return (
    <section>
      <div style={eyebrowStyle}>Capabilities</div>
      <h3 style={titleStyle}>Skills</h3>

      <div style={skillsWrap}>
        {skills.map((item, i) => {
          const label =
            item?.skills?.name ||
            item?.name;

          if (!label) return null;

          return (
            <span key={i} style={chipStyle}>
              {label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

/* styles */
const eyebrowStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.38)",
  marginBottom: 8,
};

const titleStyle = {
  color: "var(--accent-color, #F3B130)",
  margin: "0 0 16px",
  fontSize: 24,
  lineHeight: 1.15,
  fontWeight: 700,
};

const skillsWrap = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 8,
};

const chipStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "#dedede19",
  border: "1px solid #dedede3e",
  fontSize: 13,
  color: "text-accent",
};
