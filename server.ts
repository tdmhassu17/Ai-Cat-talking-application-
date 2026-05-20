import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("WARNING: GEMINI_API_KEY is not configured or has default placeholder value. Falling back to funny local simulated client.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper function to query Gemini with schema, and fallback gracefully to standard JSON query if it fails.
async function generateJSONWithFallback(
  ai: GoogleGenAI,
  model: string,
  contents: any,
  systemInstruction: string,
  schema: any,
  schemaKeys: string[]
): Promise<any> {
  let text = "";
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    text = response?.text || "";
  } catch (err) {
    console.warn(`[Gemini Engine] Primary schema generation failed, using standard query fallback. Error:`, err);
    // Secondary fallback without schema config (using raw JSON formatting in instruction/contents)
    const updatedInstruction = `${systemInstruction}\n\nIMPORTANT: You MUST return a valid JSON object matching the requested schema. Return ONLY valid JSON. Contain the keys: ${schemaKeys.map(k => `"${k}"`).join(", ")}. Do not wrap the JSON output inside markdown block code.`;
    
    // Add additional prompt guidance if contents is a string
    let finalContents = contents;
    if (typeof contents === "string") {
      finalContents = `${contents}\n\nReturn strictly JSON format with keys: ${schemaKeys.map(k => `"${k}"`).join(", ")}`;
    }
    
    const response = await ai.models.generateContent({
      model: model,
      contents: finalContents,
      config: {
        systemInstruction: updatedInstruction,
        responseMimeType: "application/json"
      }
    });
    text = response?.text || "";
  }

  if (!text) {
    throw new Error("Received empty response from Gemini API");
  }

  // Clean raw markdown identifiers
  const cleanedText = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error("JSON parsing failed. Raw response text was:", text);
    throw new Error("Unable to parse a valid JSON structured response from Gemini: " + (parseError as Error).message);
  }
}

// REST Client Endpoints

// 1. Human-to-Cat Translator
// Takes human text or speech transcripts and translates it to phonetic cat meows/vocalizations and gestures.
app.post("/api/translate/human-to-cat", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required for human-to-cat translation." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Rich simulated funny fallback if API key is not present
    const fallbacks = [
      {
        catPhonetics: "Meowww... prr-owww! *flicks tail*",
        catWords: ["Meowww", "prr-owww"],
        emotion: "Affectionate",
        gesture: "Flicks tail and rubs head against your ankle",
        pitchMultiplier: 1.15,
        tempoMultiplier: 0.95
      },
      {
        catPhonetics: "Mew! *stares blankly*",
        catWords: ["Mew"],
        emotion: "Indifferent",
        gesture: "Stares at your wall like there is a ghost there",
        pitchMultiplier: 1.3,
        tempoMultiplier: 1.2
      },
      {
        catPhonetics: "YOWLLL! Hiss-ss... *claws air*",
        catWords: ["YOWLLL", "Hiss-ss"],
        emotion: "Dramatic",
        gesture: "Knocks over an invisible glass on the shelf",
        pitchMultiplier: 0.85,
        tempoMultiplier: 1.5
      }
    ];
    const item = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return res.json({ ...item, isSimulation: true });
  }

  try {
    const prompt = `Translate the following human message/statement into a creative cat voice vocalization (phonetic meows, purrs, chirrups, yowls, etc.) and physical body language.

Human text to translate: "${text}"`;

    const systemInstruction = "You are an expert feline linguist. Translate human thoughts/statements into cat-compatible phonetics (meows, purrs, trills) and physical reactions. Return the results strictly in JSON matching the requested schema.";

    const schema = {
      type: Type.OBJECT,
      properties: {
        catPhonetics: {
          type: Type.STRING,
          description: "The complete cat translation written out phonetically (e.g. 'Prr-oww... meoww-mee-owww! *shakes tail*'). Include short action notations in asterisks."
        },
        catWords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "An array of individual meow sounds/soundpieces (e.g. ['mew', 'prr-oww', 'hiss']) suitable for driving audio synthesize beats."
        },
        emotion: {
          type: Type.STRING,
          description: "The targeted cat emotion of the translation (e.g. Suspicious, Sassy, Starving, Warm, Needy)."
        },
        gesture: {
          type: Type.STRING,
          description: "Describe the specific cat body language accompanying this voice translation. Keep it funny and descriptive."
        },
        pitchMultiplier: {
          type: Type.NUMBER,
          description: "Suggested frequency pitch shift multiplier for audio (typically 0.8 to 1.6 depending on mood)."
        },
        tempoMultiplier: {
          type: Type.NUMBER,
          description: "Suggested speech rate speed multiplier (typically 0.7 to 1.5)."
        }
      },
      required: ["catPhonetics", "catWords", "emotion", "gesture", "pitchMultiplier", "tempoMultiplier"]
    };

    const keys = ["catPhonetics", "catWords", "emotion", "gesture", "pitchMultiplier", "tempoMultiplier"];
    const data = await generateJSONWithFallback(ai, "gemini-3.5-flash", prompt, systemInstruction, schema, keys);
    return res.json(data);
  } catch (err: any) {
    console.error("Gemini API Error (human-to-cat):", err);
    return res.status(500).json({ error: err.message || "Failed to parse feline response" });
  }
});

// 2. Cat-to-Human Translator
// Takes descriptions of the meow (audio metrics combined with context variables) and translates it to funny human terms.
app.post("/api/translate/cat-to-human", async (req, res) => {
  const { soundParams, context, tailPosition, eyesState } = req.body;
  
  const audioDescription = soundParams 
    ? `Pitch: ${soundParams.pitch}Hz, Duration: ${soundParams.duration}s, Volume/Intensity: ${soundParams.intensity}`
    : "Generic cute kitty sound";

  const ai = getGeminiClient();
  if (!ai) {
    // Rich simulated funny translation fallback
    const mockTranslations = [
      {
        translation: "I demand wet food immediately. This dry kibble is cardboard, and you know it, servant.",
        confidence: 94,
        mood: "Highly Snobbish",
        catThought: "If I sing the song of my people loud enough, they will eventually crumble to my demands.",
        actionRequired: "Deliver premium tuna pate in a shiny silver dish. Do not pet."
      },
      {
        translation: "A dimensional portal has opened in the hallway closet. I am staring at the demon. Do not disturb my concentration.",
        confidence: 89,
        mood: "Slightly Unhinged",
        catThought: "Humans are so blind to the spirits that float between the walls.",
        actionRequired: "Bring high-intensity laser pointer or back away slowly."
      },
      {
        translation: "I feel an absolute, burning desire to shred your leather armchair. It calls to me. I must heed the call.",
        confidence: 97,
        mood: "Destructive ZOOMIES mode",
        catThought: "There exists a wild beast inside me. It must scratch, it must pounce.",
        actionRequired: "Throw a catnip mouse at high velocity in the opposite direction."
      },
      {
        translation: "I love you. You are a giant, clumsy, hairless kitten who cannot hunt, but you make a phenomenal warming blanket.",
        confidence: 99,
        mood: "Extremely Loving",
        catThought: "They smell like laundry detergent and safety. I will nap here for hours.",
        actionRequired: "Cease all body movement. You are now legally a cat mattress."
      }
    ];
    const item = mockTranslations[Math.floor(Math.random() * mockTranslations.length)];
    return res.json({ ...item, isSimulation: true });
  }

  try {
    const prompt = `Translate this cat's meow vocalization and physical clues into hilarious, highly accurate human subtitles.

Feline Sound Attributes:
- ${audioDescription}

Feline Context & Environmental Clues:
- Looking at/Near: ${context || "Nothing, just wandering"}
- Tail Stance: ${tailPosition || "Standard pose"}
- Eyes State: ${eyesState || "Normal blinking"}`;

    const systemInstruction = "You are the world's most advanced Cat-to-Human translator. Convert meow tones combined with behavioral clues into a sassy, humorous, and delightfully cat-like human voice translation. Keep the tone very funny, opinionated, and authentic to feline superiority. Return strictly JSON based on the schema requested.";

    const schema = {
      type: Type.OBJECT,
      properties: {
        translation: {
          type: Type.STRING,
          description: "The sassy translated human subtitle of what the cat is actually saying."
        },
        confidence: {
          type: Type.INTEGER,
          description: "The 'translated accuracy confidence value' between 1 and 100 based on the ridiculousness of the clues."
        },
        mood: {
          type: Type.STRING,
          description: "The descriptive emotional category (e.g., Passive Aggressive, Absolute Despair, Mild Tolerance, Predatory Thrill)."
        },
        catThought: {
          type: Type.STRING,
          description: "The inner, unspoken monologue or contemptuous thoughts of the cat about their human."
        },
        actionRequired: {
          type: Type.STRING,
          description: "What the human is legally bound to do to appease the cat (e.g. open door, clean poop box, deliver snack, pretend to hold a mouse)."
        }
      },
      required: ["translation", "confidence", "mood", "catThought", "actionRequired"]
    };

    const keys = ["translation", "confidence", "mood", "catThought", "actionRequired"];
    const data = await generateJSONWithFallback(ai, "gemini-3.5-flash", prompt, systemInstruction, schema, keys);
    return res.json(data);
  } catch (err: any) {
    console.error("Gemini API Error (cat-to-human):", err);
    return res.status(500).json({ error: err.message || "Failed to translate kitty meows" });
  }
});

// 3. Feline Character Chat
// Holds a conversation where a selected cat personality chats with the human.
// Returns both feline sounds and human translations.
app.post("/api/chat", async (req, res) => {
  const { message, history, breed, mood } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant character static chat fallback
    const breedPhrases: { [key: string]: string[] } = {
      Persian: ["Mewww... too lazy to speech *soft blink*", "Zzz... feed me on my pillow.", "Purrr... do not touch the fur, human."],
      Siamese: ["YAOOOWWLL! Why are you ignore me?!", "Chirrup! Talk to me! Talk back!", "Mew mew! Let us climb high places!"],
      Tabby: ["Mrr-mee-owww! You look cozy!", "Purr purr... look, a bird!", "Mew? Can I have a lick of your butter?"],
      Sphynx: ["Hiss! No, I am not naked, I am high fashion.", "Meoww-owww, wrap me in your soft blanket.", "Boop! Give body heat immediately."]
    };

    const phrases = breedPhrases[breed] || ["Meoww prrr..."];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    const translationOfPhrase = `[Simulated ${breed} Response] I am feeling ${mood || "neutral"}. Let's assume you offered a treat.`;

    return res.json({
      catPhonetics: `Purr... ${randomPhrase}`,
      translation: `Human, I hear your word: "${message}". ${translationOfPhrase}`,
      mood: mood || "Calm",
      gesture: "Stretches paws gracefully",
      isSimulation: true
    });
  }

  try {
    // Generate context instruction based on selected breed & current temporary mood
    const systemInstruction = `You are a real cat speaking to your human.
Selected Breed: ${breed || "Domestic Shorthair Tabby"}
Current Mood: ${mood || "Slightly sassy"}

Your persona characteristics:
- If Persian: Snobbish, lazy, elegant, demanding luxury, speaks in slow sleepy patterns.
- If Siamese: Super vocal, energetic, curious, loud, dramatic, gets offended easily.
- If Tabby: Friendly, local, food-motivated, loves boxes, playful, highly relatable.
- If Sphynx: Tech-savvy, loves warm spots, considers themselves a direct descendant of Egyptian gods, dramatic.

You respond to the human in two parallel tracks in a JSON object:
1. "catPhonetics": Your immediate feline vocal response (phonetic meows, purrs, squeaks, trills) accompanied by physical body gestures in asterisks. Keep it adorable, raw, or funny.
2. "translation": The translated human subtitle of what you actually mean. Keep it sassy, clever, feline-centric, affectionate, or slightly insulting as fitting your mood and breed!

Maintain conversation context. Avoid generic boilerplate. Respond strictly with a JSON object matching the schema.`;

    // Flatten history for Gemini
    const formattedContents = history ? history.map((h: any) => {
      return {
        role: h.role === "model" ? "model" as const : "user" as const,
        parts: [{ text: h.text }]
      };
    }) : [];

    // Append the latest message
    formattedContents.push({
      role: "user" as const,
      parts: [{ text: message }]
    });

    const schema = {
      type: Type.OBJECT,
      properties: {
        catPhonetics: {
          type: Type.STRING,
          description: "The cat sounds/gestures (e.g. 'Purrr... Mewww! *flops on side*')"
        },
        translation: {
          type: Type.STRING,
          description: "The translated subtitles in sassy human language."
        },
        mood: {
          type: Type.STRING,
          description: "The current emotional mood of the cat (e.g., Starving, Tolerant, Cuddly, Annoyed)."
        },
        gesture: {
          type: Type.STRING,
          description: "A funny brief description of the action the cat does (e.g., Knocks over pen, Rubs cheeks on phone)."
        }
      },
      required: ["catPhonetics", "translation", "mood", "gesture"]
    };

    const keys = ["catPhonetics", "translation", "mood", "gesture"];
    const data = await generateJSONWithFallback(ai, "gemini-3.5-flash", formattedContents, systemInstruction, schema, keys);
    return res.json(data);
  } catch (err: any) {
    console.error("Gemini API Error (chat):", err);
    return res.status(500).json({ error: err.message || "Failed to make conversation" });
  }
});

// 4. Acoustic Nuance Feline Emotion Analyzer
// Explicitly analyzes structural components/nuances of a meow (pitch, duration, vibrato, and volume progress)
// to categorize it into 'happy', 'anxious', 'hungry', 'playful', or 'seeking attention'.
app.post("/api/analyze/meow-emotions", async (req, res) => {
  const { pitch, duration, vibrato, volumeProgress, environmentalContext } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    // Rich offline simulation mapped to expected emotions based on pitch and duration
    let emotion: 'happy' | 'anxious' | 'hungry' | 'playful' | 'seeking attention' = 'seeking attention';
    let explanation = "Detected a medium-frequency standard vocalization with stable amplitude. Indicates standard curiosity.";
    let translation = "Pet me, or look at me. Or just acknowledge my majestic existence.";
    let actionItem = "Blink slowly, speak in high pitch baby tone, adjust pillows.";

    if (pitch > 800) {
      if (duration < 0.5) {
        emotion = 'happy';
        explanation = "High frequency short chirrup indicates greeting, slow purr base, positive vibes.";
        translation = "Hooray, you're awake! Let's examine the window flies!";
        actionItem = "Gentle head scratches on the chin.";
      } else if (vibrato) {
        emotion = 'playful';
        explanation = "Trills combined with high variable pitch matches active vocal zoomies and high energy.";
        translation = "Pounce time! Watch me glide underneath the sofa like a slippery shadow!";
        actionItem = "Fetch the red laser, feather wand, or some crisp crinkly paper bag.";
      } else {
        emotion = 'hungry';
        explanation = "Persistent high pitch flat tone, demanding high intensity. Highly sound-equivalent to distress chirp.";
        translation = "Look, the steel bowl has a circle of metal showing. This is a level 5 catastrophe.";
        actionItem = "Fill the cat dish with exquisite organic fish morsels immediately.";
      }
    } else if (pitch < 400) {
      emotion = 'anxious';
      explanation = "Low, long drawn-out vocalizations with high starting intensity suggest insecurity, growling-border, or general irritation.";
      translation = "What was that weird sound outside? Why did you move that chair? I am offended.";
      actionItem = "Give space and a cozy secure box. Speak softly.";
    }

    return res.json({
      emotion,
      confidence: Math.floor(Math.random() * 15) + 80, // 80 to 95
      explanation,
      translation,
      actionItem,
      acousticMetricsParsed: {
        avgPitchHz: pitch || 520,
        lengthSeconds: duration || 1.1,
        containsTrill: !!vibrato,
        volumePattern: volumeProgress || "steady"
      },
      isSimulation: true
    });
  }

  try {
    const prompt = `Perform an acoustic nuance analysis on this feline's vocalization attributes to classify its emotional state.
Attributes parsed:
- Fundamental Average Pitch: ${pitch || 550} Hz
- Sound Duration: ${duration || 0.8} seconds
- Has Vibrato/Trill (Acoustic Wavering): ${vibrato ? "Yes, high rate waver" : "No, uniform envelope"}
- Amplitude Volume Pattern: ${volumeProgress || "Rising steadily / sharp start"}
- Environmental Environmental Clues: ${environmentalContext || "No context given"}

Categorize this vocalization strictly into one of these general emotions:
'happy', 'anxious', 'hungry', 'playful', or 'seeking attention'.`;

    const systemInstruction = "You are the leading expert AI Feline Communication & Bioacoustics Model. Analyze the parameters of the meow (including typical pitch, duration profiles, vibrato indices, and volume flows) to determine the exact emotional category ('happy', 'anxious', 'hungry', 'playful', or 'seeking attention'). Return diagnostic results and details strictly in JSON format as defined.";

    const schema = {
      type: Type.OBJECT,
      properties: {
        emotion: {
          type: Type.STRING,
          description: "The primary classified emotion of the meow. Must be exactly one of: 'happy', 'anxious', 'hungry', 'playful', or 'seeking attention'."
        },
        confidence: {
          type: Type.INTEGER,
          description: "Confidence rating percentage of this classification (from 1 to 100)."
        },
        explanation: {
          type: Type.STRING,
          description: "Explain the acoustic reasoning of your choice based on pitch, vibrato, and volume flow."
        },
        translation: {
          type: Type.STRING,
          description: "A funny subtitle in human translated text of what the feline means."
        },
        actionItem: {
          type: Type.STRING,
          description: "Actionable advice for the human to answer the cat's mood."
        }
      },
      required: ["emotion", "confidence", "explanation", "translation", "actionItem"]
    };

    const keys = ["emotion", "confidence", "explanation", "translation", "actionItem"];
    const data = await generateJSONWithFallback(ai, "gemini-3.5-flash", prompt, systemInstruction, schema, keys);
    return res.json({
      ...data,
      acousticMetricsParsed: {
        avgPitchHz: pitch || 550,
        lengthSeconds: duration || 0.8,
        containsTrill: !!vibrato,
        volumePattern: volumeProgress || "normal"
      }
    });
  } catch (err: any) {
    console.error("Gemini API Error (meow-emotions-analyzer):", err);
    return res.status(500).json({ error: err.message || "Failed to analyze feline acoustic nuances" });
  }
});


// Configure Vite / Static asset server
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode (with Vite middleware)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cat Voice Translator full-stack server running at http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Fatal server start error:", err);
});
