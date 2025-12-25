"use server"

import { experimental_generateImage as generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createCanvas, loadImage, registerFont } from "canvas"
import path from "path"

// 1. Define Template Configurations with "Zones"
interface TextZone {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  align?: "left" | "center" | "right";
}

interface MemeConfig {
  path: string;
  zones: TextZone[];
}

const TEMPLATE_CONFIGS: Record<string, MemeConfig> = {
  drake: {
    path: "/public/meme-templates/drake.jpg",
    zones: [
      { x: 400, y: 0, width: 400, height: 300 },   // Top right box
      { x: 400, y: 300, width: 400, height: 300 }, // Bottom right box
    ],
  },
  distracted: {
    path: "/public/meme-templates/distracted-boyfriend.jpg",
    zones: [
      { x: 150, y: 400, width: 200, height: 150 }, // Left person
      { x: 400, y: 300, width: 200, height: 150 }, // Middle person
      { x: 600, y: 400, width: 200, height: 150 }, // Right person
    ],
  },
  "two-buttons": {
    path: "/public/meme-templates/two-buttons.jpg",
    zones: [
      { x: 50, y: 50, width: 150, height: 100, fontSize: 25 },
      { x: 230, y: 30, width: 150, height: 100, fontSize: 25 },
    ],
  },
  // Default fallback for simple top/bottom
  default: {
    path: "/public/meme-templates/default.jpg",
    zones: [
      { x: 0, y: 20, width: 800, height: 150, align: "center" },
      { x: 0, y: 430, width: 800, height: 150, align: "center" },
    ],
  },
}

// 2. Helper to wrap text
function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ")
  let line = ""
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      ctx.strokeText(line, x, currentY)
      line = words[n] + " "
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  ctx.strokeText(line, x, currentY)
}

export async function generateMeme(
  prompt: string,
  template: string,
  texts: string[], // Changed to array to support multiple zones
  useAI = true,
) {
  if (useAI) {
    try {
      // Enhance the AI prompt to be more specific to meme culture
      const enhancedPrompt = `A high-quality meme image. Theme: ${prompt}. 
      Style: Viral internet meme, bold colors. 
      Overlay text: "${texts.join(" ")}". 
      Ensure the image has clear composition for a meme format.`

      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: enhancedPrompt,
        size: "1024x1024",
      })

      return { imageUrl: `data:${image.mimeType};base64,${image.base64}`, usedFallback: false }
    } catch (error) {
      console.error("AI Generation failed, falling back...", error)
    }
  }

  return {
    imageUrl: await generateCanvasMeme(template, texts),
    usedFallback: true,
  }
}

async function generateCanvasMeme(templateKey: string, texts: string[]): Promise<string> {
  const config = TEMPLATE_CONFIGS[templateKey] || TEMPLATE_CONFIGS.default
  
  // Register font (Ensure you have the .ttf file in your project)
  // registerFont(path.join(process.cwd(), 'public/fonts/impact.ttf'), { family: 'Impact' });

  const canvas = createCanvas(800, 600)
  const ctx = canvas.getContext("2d")

  try {
    // Load Template
    const image = await loadImage(path.join(process.cwd(), config.path))
    ctx.drawImage(image, 0, 0, 800, 600)

    // Text Styling
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 4
    ctx.font = "bold 40px Impact"

    // Draw text in zones
    config.zones.forEach((zone, index) => {
      const text = texts[index]
      if (!text) return

      const fontSize = zone.fontSize || 40
      ctx.font = `bold ${fontSize}px Impact`
      
      // Calculate alignment
      let drawX = zone.x
      if (zone.align === "center") {
        ctx.textAlign = "center"
        drawX = zone.x + zone.width / 2
      } else {
        ctx.textAlign = "left"
      }

      wrapText(ctx, text.toUpperCase(), drawX, zone.y + fontSize, zone.width, fontSize * 1.1)
    })

    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Canvas Error:", error)
    return "/error-placeholder.png"
  }
}