const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeUrl = (value) => {
  const url = String(value ?? "").trim();
  return /^https?:\/\//i.test(url) ? esc(url) : "";
};

const resumeTemplate = (data) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(data.fullName)} — Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Arial', sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
    padding: 36px 48px;
    max-width: 860px;
    margin: 0 auto;
  }

  /* ── Header ── */
  .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 22pt; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
  .contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin-top: 6px;
    font-size: 9.5pt;
    color: #333;
  }
  .contact-row a { color: #1a1a1a; text-decoration: none; }
  .contact-row span::before { content: "•"; margin-right: 16px; color: #999; }
  .contact-row span:first-child::before { content: ""; margin: 0; }

  /* ── Sections ── */
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    border-bottom: 1px solid #1a1a1a;
    padding-bottom: 3px;
    margin-bottom: 10px;
    color: #1a1a1a;
  }

  /* ── Summary ── */
  .summary p { font-size: 10.5pt; color: #222; }

  /* ── Experience ── */
  .entry { margin-bottom: 12px; }
  .entry-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .entry-title { font-weight: 700; font-size: 11pt; }
  .entry-sub { font-size: 10pt; color: #444; margin-top: 1px; }
  .entry-meta { font-size: 9.5pt; color: #555; text-align: right; white-space: nowrap; }
  .entry ul { margin-top: 5px; padding-left: 18px; }
  .entry ul li { font-size: 10.5pt; color: #222; margin-bottom: 2px; }

  /* ── Education ── */
  .edu-entry { margin-bottom: 8px; }

  /* ── Skills ── */
  .skills-grid { display: flex; flex-direction: column; gap: 5px; }
  .skill-row { display: flex; gap: 8px; font-size: 10.5pt; }
  .skill-name { font-weight: 700; min-width: 140px; color: #1a1a1a; }
  .skill-desc { color: #333; }

  /* ── Projects ── */
  .project-entry { margin-bottom: 10px; }
  .project-header { display: flex; justify-content: space-between; align-items: baseline; }
  .project-name { font-weight: 700; font-size: 11pt; }
  .project-links { font-size: 9pt; color: #444; }
  .project-links a { color: #1a1a1a; text-decoration: underline; margin-left: 10px; }
  .project-desc { font-size: 10.5pt; color: #333; margin-top: 3px; }

  /* ── Certifications ── */
  .cert-entry { margin-bottom: 7px; }
  .cert-header { display: flex; justify-content: space-between; }
  .cert-name { font-weight: 700; font-size: 10.5pt; }
  .cert-date { font-size: 9.5pt; color: #555; }
  .cert-issuer { font-size: 10pt; color: #444; }
  .cert-url a { font-size: 9pt; color: #1a1a1a; text-decoration: underline; }

  @media print {
    body { padding: 20px 28px; }
    a { text-decoration: none !important; }
  }
</style>
</head>
<body>

<!-- ══ HEADER ══════════════════════════════════════════════ -->
<div class="header">
  <h1>${esc(data.fullName)}</h1>
  <div class="contact-row">
    <span>${esc(data.email)}</span>
    <span>${esc(data.phone)}</span>
    <span>${esc(data.location)}</span>
    ${safeUrl(data.linkedinUrl) ? `<span><a href="${safeUrl(data.linkedinUrl)}">LinkedIn</a></span>` : ""}
    ${safeUrl(data.githubProfileLink) ? `<span><a href="${safeUrl(data.githubProfileLink)}">GitHub</a></span>` : ""}
    ${safeUrl(data.portfolioUrl) ? `<span><a href="${safeUrl(data.portfolioUrl)}">Portfolio</a></span>` : ""}
  </div>
</div>

<!-- ══ SUMMARY ══════════════════════════════════════════════ -->
${
  data.summary
    ? `
<div class="section summary">
  <div class="section-title">Professional Summary</div>
  <p>${esc(data.summary)}</p>
</div>`
    : ""
}

<!-- ══ EXPERIENCE ═══════════════════════════════════════════ -->
${
  data.experiences && data.experiences.length > 0
    ? `
<div class="section">
  <div class="section-title">Work Experience</div>
  ${data.experiences
    .map(
      (exp) => `
  <div class="entry">
    <div class="entry-header">
      <div>
        <div class="entry-title">${esc(exp.jobTitle)}</div>
        <div class="entry-sub">${esc(exp.company)}${exp.expLocation ? ` &nbsp;·&nbsp; ${esc(exp.expLocation)}` : ""}</div>
      </div>
      <div class="entry-meta">${esc(exp.duration)}</div>
    </div>
    ${
      exp.achievements
        ? `
    <ul>
      ${(Array.isArray(exp.achievements)
        ? exp.achievements
        : exp.achievements
            .split(/\n|•/)
            .map((a) => a.trim())
            .filter(Boolean)
      )
        .map((a) => `<li>${esc(a)}</li>`)
        .join("")}
    </ul>`
        : ""
    }
  </div>`,
    )
    .join("")}
</div>`
    : ""
}

<!-- ══ EDUCATION ════════════════════════════════════════════ -->

${
  data.education && data.education.length > 0
    ? `
<div class="section">
  <div class="section-title">Education</div>
  ${data?.education
    ?.map(
      (edu) => `
  <div class="edu-entry">
    <div class="entry-header">
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
        <div>
          <div class="entry-title">${esc(edu?.degree)}</div>
          <div class="entry-sub">${esc(edu?.institution)}</div>
        </div>
        ${edu?.result ? `<div class="entry-sub">${esc(edu.result)}</div>` : ""}
      </div>
    </div>
  </div>`,
    )
    .join("")}
</div>`
    : ""
}

<!-- ══ SKILLS ═══════════════════════════════════════════════ -->
${
  data.skills && data.skills.length > 0
    ? `
<div class="section">
  <div class="section-title">Skills</div>
  <div class="skills-grid">
    ${data.skills
      .map(
        (skill) => `
    <div class="skill-row">
      <span class="skill-name">${esc(skill.name)}</span>
      <span class="skill-desc">${esc(skill.description)}</span>
    </div>`,
      )
      .join("")}
  </div>
</div>`
    : ""
}

<!-- ══ PROJECTS ══════════════════════════════════════════════ -->
${
  data.projects && data.projects.length > 0
    ? `
<div class="section">
  <div class="section-title">Projects</div>
  ${data.projects
    .map(
      (proj) => `
  <div class="project-entry">
    <div class="project-header">
      <span class="project-name">${esc(proj.name)}</span>
      <span class="project-links">
        ${safeUrl(proj.githubLink) ? `<a href="${safeUrl(proj.githubLink)}">GitHub</a>` : ""}
        ${safeUrl(proj.liveLink) ? `<a href="${safeUrl(proj.liveLink)}">Live</a>` : ""}
      </span>
    </div>
    <p class="project-desc">${esc(proj.description)}</p>
  </div>`,
    )
    .join("")}
</div>`
    : ""
}

<!-- ══ CERTIFICATIONS ════════════════════════════════════════ -->
${
  data.certifications && data.certifications.length > 0
    ? `
<div class="section">
  <div class="section-title">Certifications</div>
  ${data.certifications
    .map(
      (cert) => `
  <div class="cert-entry">
    <div class="cert-header">
      <span class="cert-name">${esc(cert.name)}</span>
      <span class="cert-date">${esc(cert.issueDate)}</span>
    </div>
    <div class="cert-issuer">${esc(cert.issuer)}</div>
    ${
      safeUrl(cert.credentialUrl)
        ? `<div class="cert-url"><a href="${safeUrl(cert.credentialUrl)}">View Credential</a></div>`
        : ""
    }
  </div>`,
    )
    .join("")}
</div>`
    : ""
}

</body>
</html>`;
};

export default resumeTemplate;
