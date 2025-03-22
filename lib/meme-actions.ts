"use server"

import { experimental_generateImage as generateImage } from "ai"
import { openai } from "@ai-sdk/openai"
import { createCanvas, loadImage } from "canvas"

// Template images for fallback mode
const TEMPLATE_IMAGES = {
  drake: "/meme-templates/drake.jpg",
  distracted: "/meme-templates/distracted-boyfriend.jpg",
  doge: "/meme-templates/doge.jpg",
  "change-my-mind": "/meme-templates/change-my-mind.jpg",
  "two-buttons": "/meme-templates/two-buttons.jpg",
  "expanding-brain": "/meme-templates/expanding-brain.jpg",
}

export async function generateMeme(
  prompt: string,
  template: string,
  topText: string,
  bottomText: string,
  useAI = true,
): Promise<{ imageUrl: string; usedFallback: boolean }> {
  // Try AI generation first if requested
  if (useAI) {
    try {
      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt: prompt,
        size: "1024x1024",
      })

      const imageUrl = `data:${image.mimeType};base64,${image.base64}`
      return {
        imageUrl,
        usedFallback: false,
      }
    } catch (error) {
      console.error("Error with AI generation:", error)
      // Fall through to fallback method
    }
  }

  // Fallback: Generate meme using canvas and template images
  try {
    const imageUrl = await generateFallbackMeme(template, topText, bottomText)
    return {
      imageUrl,
      usedFallback: true,
    }
  } catch (fallbackError) {
    console.error("Error with fallback generation:", fallbackError)
    throw new Error("Failed to generate meme using all available methods")
  }
}

async function generateFallbackMeme(template: string, topText: string, bottomText: string): Promise<string> {
  // Use a placeholder if template doesn't exist
  const templateUrl =
    TEMPLATE_IMAGES[template as keyof typeof TEMPLATE_IMAGES] || "/placeholder.svg?height=600&width=600"

  // Create canvas
  const canvas = createCanvas(800, 600)
  const ctx = canvas.getContext("2d")

  try {
    // Load and draw the template image
    const image = await loadImage(templateUrl)

    // Calculate aspect ratio to fit image properly
    const aspectRatio = image.width / image.height
    let drawWidth = 800
    let drawHeight = 800 / aspectRatio

    if (drawHeight > 600) {
      drawHeight = 600
      drawWidth = 600 * aspectRatio
    }

    // Center the image
    const x = (800 - drawWidth) / 2
    const y = (600 - drawHeight) / 2

    // Draw background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, 800, 600)

    // Draw image
    ctx.drawImage(image, x, y, drawWidth, drawHeight)

    // Add text
    ctx.fillStyle = "white"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 5
    ctx.textAlign = "center"
    ctx.font = "bold 40px Impact"

    // Draw top text
    if (topText) {
      ctx.fillText(topText, 400, 50, 780)
      ctx.strokeText(topText, 400, 50, 780)
    }

    // Draw bottom text
    if (bottomText) {
      ctx.fillText(bottomText, 400, 550, 780)
      ctx.strokeText(bottomText, 400, 550, 780)
    }

    // Convert to data URL
    return canvas.toDataURL("image/png")
  } catch (error) {
    console.error("Error generating fallback meme:", error)
    throw error
  }
}

