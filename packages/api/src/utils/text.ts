import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFParse } from "pdf-parse";

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

export async function splitText(text: string): Promise<string[]> {
  return await textSplitter.splitText(text);
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  if (mimetype === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } else if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  } else {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }
}
