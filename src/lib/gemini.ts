import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface GenerationRequest {
  type: "Motivation" | "Success" | "Money" | "Children Stories" | "Islamic Lifestyle" | "Coloring";
  title: string;
  theme: string;
  audience: string;
  tone: "Simple" | "Inspiring" | "Educational";
  pageCount: number; 
  wordsPerPage: number;
}

export interface BookManuscript {
  coverPrompt: string;
  pages: {
    pageNumber: number;
    title?: string;
    content: string;
    imagePrompt: string;
    imageUrl?: string;
  }[];
}

export async function generateImage(prompt: string): Promise<string | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing, skipping image generation");
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}

// Internal generation logic (MOCK AI for text)
export async function generateBookContent(req: GenerationRequest): Promise<BookManuscript> {
  await new Promise(resolve => setTimeout(resolve, 2500));
  const isColoring = req.type === "Coloring";

  const pages = [];
  // Generate Chapters
  for (let i = 1; i <= req.pageCount; i++) {
    const title = isColoring ? `Coloring Page ${i}` : `Chapter ${i}: The Path to ${req.theme}`;
    const content = isColoring 
      ? `Coloring Page ${i}: Features a beautiful "${req.theme}" illustration for children to color.` 
      : generateMockContent(req, i, false);
    const imagePrompt = isColoring 
      ? `Kids coloring book page, black and white bold line art, clean outlines, no shading, white background, ${req.theme} theme, high contrast, minimalist cute style.`
      : generateMockPrompt(req, i);

    pages.push({
      pageNumber: i,
      title,
      content,
      imagePrompt
    });
  }

  // Add Conclusion (only for non-coloring books)
  if (!isColoring) {
    pages.push({
      pageNumber: req.pageCount + 1,
      title: "Conclusion",
      content: `In summary, the journey of "${req.title}" shows us that with a ${req.tone.toLowerCase()} approach, anything is possible. We hope this guide on ${req.type} has enlightened your path.`,
      imagePrompt: `A peaceful closing scene representing fulfillment and completion for ${req.title}.`
    });
  }

  const coverPrompt = isColoring
    ? `Professional kids coloring book cover, bold colorful characters featuring ${req.theme}, text "${req.title}", vibrant and cheerful for children.`
    : `Stunning professional book cover for "${req.title}". Genre: ${req.type}. Style: Cinematic, high-quality illustration. Features: Central thematic element representing ${req.theme}. Atmosphere: ${req.tone}. Vibrant colors, eye-catching composition.`;

  return { 
    coverPrompt,
    pages 
  };
}

function generateMockContent(req: GenerationRequest, index: number, isConclusion: boolean): string {
  const tonePrefix = req.tone === "Inspiring" ? "Imagine a world where " : req.tone === "Educational" ? "It is important to understand that " : "Basically, ";
  
  const content = `${tonePrefix} on page ${index}, we explore ${req.theme}. This ${req.type} guide is specifically written for ${req.audience} to provide value and insight. ${"This is a sample of the high-quality content Aala AI generates automatically. ".repeat(Math.ceil(req.wordsPerPage / 15))}`;
  
  return content.substring(0, req.wordsPerPage * 6);
}

function generateMockPrompt(req: GenerationRequest, index: number): string {
  return `Cinematic Pixar-style illustration for ${req.title}, scene ${index}. Emotionally engaging atmosphere showing ${req.theme} for ${req.audience}. High detail, consistent character design, golden hour lighting.`;
}
