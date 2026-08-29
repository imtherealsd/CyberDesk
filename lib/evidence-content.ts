export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

export async function getExtractionContent(file: File, mimeType: string) {
  if (mimeType === "text/plain") {
    return { kind: "text" as const, data: (await file.text()).slice(0, 60_000), mimeType };
  }

  return {
    kind: mimeType.startsWith("image/") ? "image" as const : "file" as const,
    data: await readFileAsDataUrl(file),
    mimeType,
  };
}
