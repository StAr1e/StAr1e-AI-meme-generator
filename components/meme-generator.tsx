"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download, AlertCircle, Sparkles, ImageIcon, Wand2, Palette, Type } from "lucide-react"
import Image from "next/image"
import { generateMeme } from "@/lib/meme-actions"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const MEME_TEMPLATES = [
  { id: "drake", name: "Drake Hotline Bling" },
  { id: "distracted", name: "Distracted Boyfriend" },
  { id: "doge", name: "Doge" },
  { id: "change-my-mind", name: "Change My Mind" },
  { id: "two-buttons", name: "Two Buttons" },
  { id: "expanding-brain", name: "Expanding Brain" },
]

export default function MemeGenerator() {
  const [template, setTemplate] = useState("drake")
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [prompt, setPrompt] = useState("")
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useAI, setUseAI] = useState(true)
  const [usedFallback, setUsedFallback] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const imageRef = useRef<HTMLDivElement>(null)

  // Simulate progress during generation
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (loading) {
      setIsGenerating(true)
      setGenerationProgress(0)

      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          const newProgress = prev + (100 - prev) * 0.1
          return newProgress > 95 ? 95 : newProgress
        })
      }, 300)
    } else if (isGenerating) {
      setGenerationProgress(100)
      const timeout = setTimeout(() => {
        setIsGenerating(false)
      }, 500)

      return () => clearTimeout(timeout)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading, isGenerating])

  // Animation when meme is generated
  useEffect(() => {
    if (generatedMeme && imageRef.current) {
      imageRef.current.classList.add("scale-in")

      const timeout = setTimeout(() => {
        if (imageRef.current) {
          imageRef.current.classList.remove("scale-in")
        }
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [generatedMeme])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)
      setActiveTab("preview")

      const memePrompt = buildMemePrompt(template, topText, bottomText, prompt)
      const result = await generateMeme(memePrompt, template, topText, bottomText, useAI)

      setGeneratedMeme(result.imageUrl)
      setUsedFallback(result.usedFallback)

      if (result.usedFallback && useAI) {
        setError("AI generation failed. Using fallback method instead.")
      }
    } catch (error) {
      console.error("Failed to generate meme:", error)
      setError("Failed to generate meme. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const buildMemePrompt = (template: string, topText: string, bottomText: string, customPrompt: string) => {
    let basePrompt = `Generate a meme image using the ${MEME_TEMPLATES.find((t) => t.id === template)?.name} template`

    if (topText) basePrompt += ` with top text saying "${topText}"`
    if (bottomText) basePrompt += ` and bottom text saying "${bottomText}"`
    if (customPrompt) basePrompt += `. Additional context: ${customPrompt}`

    return basePrompt
  }

  const handleDownload = () => {
    if (!generatedMeme) return

    const link = document.createElement("a")
    link.href = generatedMeme
    link.download = `meme-${template}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="create" className="text-base py-3">
            <Type className="h-4 w-4 mr-2" />
            Create
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-base py-3">
            <ImageIcon className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="animate-in slide-up">
          <Card className="border border-border/40 shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Design Your Meme
              </CardTitle>
              <CardDescription>Choose a template and add your text to create a custom meme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="template" className="text-base">
                  Meme Template
                </Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger id="template" className="h-12">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEME_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="top-text" className="text-base">
                  Top Text
                </Label>
                <Input
                  id="top-text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Enter top text"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bottom-text" className="text-base">
                  Bottom Text
                </Label>
                <Input
                  id="bottom-text"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Enter bottom text"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt" className="text-base">
                    Additional Context
                  </Label>
                  <Badge variant="outline" className="font-normal text-xs">
                    Optional
                  </Badge>
                </div>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Add any additional context for the AI"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <Label htmlFor="use-ai" className="font-medium">
                    AI-Powered Generation
                  </Label>
                </div>
                <Switch
                  id="use-ai"
                  checked={useAI}
                  onCheckedChange={setUseAI}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="w-full text-base h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Meme
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="animate-in slide-up">
          <Card className="border border-border/40 shadow-lg bg-card/80 backdrop-blur-sm meme-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Your Meme
              </CardTitle>
              <CardDescription>Preview and download your generated meme</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6 animate-in fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {usedFallback && !error && (
                <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 animate-in fade-in">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Using Template Mode</AlertTitle>
                  <AlertDescription>Generated using template-based approach instead of AI.</AlertDescription>
                </Alert>
              )}

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative w-full max-w-md h-4 bg-muted rounded-full overflow-hidden mb-4">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300 shimmer"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-base font-medium">Creating your masterpiece...</p>
                  </div>
                </div>
              ) : generatedMeme ? (
                <div className="flex flex-col items-center" ref={imageRef}>
                  <div className="relative w-full aspect-square max-w-md mb-6 rounded-lg overflow-hidden gradient-border glow">
                    <Image
                      src={generatedMeme || "/placeholder.svg"}
                      alt="Generated meme"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-muted-foreground/20 rounded-lg p-6">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground text-center">
                    Your generated meme will appear here. Fill out the form and click "Generate Meme" to create one.
                  </p>
                </div>
              )}
            </CardContent>
            {generatedMeme && (
              <CardFooter className="flex justify-center pt-2 pb-6">
                <Button
                  onClick={handleDownload}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-200 animate-in fade-in"
                >
                  <Download className="h-5 w-5" />
                  Download Meme
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview */}
      {template && !generatedMeme && activeTab === "create" && (
        <div className="mt-8 flex justify-center animate-in fade-in">
          <div className="relative w-full max-w-xs aspect-square rounded-md overflow-hidden border border-border/40 shadow-md">
            <Image src={`/meme-templates/${template}.jpg`} alt={`${template} template`} fill className="object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        </div>
      )}
    </div>
  )
}

