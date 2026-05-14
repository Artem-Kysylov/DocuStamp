export const isPdfFile = (file) => {
  if (!file) {
    return false;
  }
  const lowerName = file.name?.toLowerCase() ?? "";
  return file.type === "application/pdf" || lowerName.endsWith(".pdf");
};

export const readFileToBytes = async (file) =>
  new Uint8Array(await file.arrayBuffer());

export const buildDownloadName = (name) => {
  const safe = name?.trim() || "document.pdf";
  const base = safe.replace(/\.pdf$/i, "");
  return `${base}-docstamp.pdf`;
};
