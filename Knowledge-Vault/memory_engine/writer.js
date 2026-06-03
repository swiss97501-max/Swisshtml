import fs from "fs";

export function writeMD(path, data) {
  const md = `# ${data.title || "Untitled"}

id: ${data.id}

type: ${data.type}

confidence: ${data.confidence ?? 0}

---

${data.body || ""}

source:
${(data.source || []).map(s => `- ${s}`).join("\n")}
`;

  fs.writeFileSync(path, md, "utf-8");
}
