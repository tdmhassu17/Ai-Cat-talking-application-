import { useState, useEffect, useRef } from "react";
import {
  Activity,
  Volume2,
  MessageSquare,
  Mic,
  Send,
  Sparkles,
  Sliders,
  RotateCcw,
  ShieldAlert,
  Cat,
  Play,
  VolumeX,
  Info,
  Layers,
  Heart,
  TrendingUp,
  Brain,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import {
  FelineSoundParams,
  CatBreed,
  CatMood,
  BreedTemplate,
  ChatMessage,
  HumanToCatResponse,
  CatToHumanResponse,
  FelineEmotionAnalysisResponse
} from "./types";

// Static Breed templates
const BREEDS: BreedTemplate[] = [
  {
    name: "Tabby",
    description: "Everyday local neighborhood boss. Food-motivated, loves cardboard boxes, highly down-to-earth.",
    avatar: "🐈",
    tagline: "The Everyday Companion"
  },
  {
    name: "Siamese",
    description: "Yack queen. Outrageously vocal, dramatic, energetic. Will shout at you if ignored for 12 seconds.",
    avatar: "🐱",
    tagline: "The Vocal Royalty"
  },
  {
    name: "Persian",
    description: "Laid back royal cloud. Extremely lazy, loves silky pillows, looks at you with permanent snobbish tolerance.",
    avatar: "🦁",
    tagline: "The Majestic Pillow Queen"
  },
  {
    name: "Sphynx",
    description: "Direct descendant of Pharaoh gods. Wrinkly, tech-loving, seeks warm radiators and persistent physical headers.",
    avatar: "🐾",
    tagline: "The Alien Snuggler"
  }
];

// Human speech suggestions for Tab 2
const HUMAN_PHRASES = [
  "Get off the dining table right now!",
  "Are you hungry? Do you want some premium wet food?",
  "I am leaving for work, please do not shred the curtains.",
  "Who is the most beautiful kitten in the entire galaxy?",
  "Please let me sleep, it is three o'clock in the morning."
];

// Initial mock interaction logs to fill space elegantly
const INITIAL_LOGS = [
  {
    id: "log-1",
    timestamp: "10:42 AM",
    type: "Analysis",
    title: "Mew to Human Translation",
    subtitle: "Pitch: 680Hz • Duration: 1.2s",
    text: "I am mildly inconvenienced by the empty bowl.",
    emotion: "hungry"
  },
  {
    id: "log-2",
    timestamp: "09:15 AM",
    type: "Synth",
    title: "Human to Mew Synthesizer",
    subtitle: "Target: Persian",
    text: "Saying: 'Who is a good kitty?' -> Synthesized 'Mrrr-mew! *flops*'",
    emotion: "happy"
  },
  {
    id: "log-3",
    timestamp: "Yesterday",
    type: "Analysis",
    title: "Vocalization Diagnostic",
    subtitle: "Pitch: 840Hz • Duration: 0.6s • Vibrato",
    text: "The sparrow fluttering outside is mocking me.",
    emotion: "playful"
  }
];

export default function App() {
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<"analyze" | "synth" | "chat">("analyze");
  
  // App logs/history
  const [logs, setLogs] = useState<any[]>(INITIAL_LOGS);

  // Audio elements & recording live pitch
  const [isRecording, setIsRecording] = useState(false);
  const [micPitch, setMicPitch] = useState<number | null>(null);
  const [micDuration, setMicDuration] = useState<number>(0);
  const [amplitudeData, setAmplitudeData] = useState<number[]>(new Array(16).fill(10));
  
  // Custom Slider inputs for tab 1 (Acoustic Simulator)
  const [simPitch, setSimPitch] = useState<number>(550);
  const [simDuration, setSimDuration] = useState<number>(0.8);
  const [simVibrato, setSimVibrato] = useState<boolean>(false);
  const [simVolumePattern, setSimVolumePattern] = useState<string>("Slight rise, soft release");
  const [simContext, setSimContext] = useState<string>("Near their feeding area");

  // Tab 1 Analysis Output
  const [analysisResult, setAnalysisResult] = useState<FelineEmotionAnalysisResponse | null>({
    emotion: "seeking attention",
    confidence: 88,
    explanation: "Fundamental frequency sits firmly in the middle octave (550Hz) with standard duration profile. Indicates structured communicative contact rather than distress or alarm.",
    translation: "Greetings, tall hairless servant. I am briefly acknowledging your presence in exchange for potential back-scratches.",
    actionItem: "Indulge with gentle fingertip strokes along the cheek glands. Do not pick up or carry.",
    acousticMetricsParsed: {
      avgPitchHz: 550,
      lengthSeconds: 0.8,
      containsTrill: false,
      volumePattern: "Slight rise, soft release"
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tab 2 Synthesizer Inputs & Outputs
  const [humanText, setHumanText] = useState("");
  const [synthResult, setSynthResult] = useState<HumanToCatResponse | null>(null);
  const [isGeneratingSynth, setIsGeneratingSynth] = useState(false);
  const [synthVoiceTimbre, setSynthVoiceTimbre] = useState<"standard" | "fluffy" | "sleepy" | "angry">("standard");

  // Tab 3 Conversational Kitty Chats
  const [selectedBreed, setSelectedBreed] = useState<CatBreed>("Tabby");
  const [chatMood, setChatMood] = useState<CatMood>("Curious");
  const [chatInput, setChatInput] = useState("");
  const [isTypingChat, setIsTypingChat] = useState(false);
  const [chatsByBreed, setChatsByBreed] = useState<{ [key in CatBreed]: ChatMessage[] }>({
    Tabby: [
      {
        id: "t1",
        role: "model",
        text: "Mrr-owww... *scratches ears* Hello there! Sells soul for tuna, what do you request today?",
        catPhonetics: "Mrr-owww... *scratches*",
        timestamp: new Date()
      }
    ],
    Siamese: [
      {
        id: "s1",
        role: "model",
        text: "Yowwwl! Finally, someone returns! I was screaming at the window flies for an hour. Pay attention!",
        catPhonetics: "YOWLLL! *shakes ears*",
        timestamp: new Date()
      }
    ],
    Persian: [
      {
        id: "p1",
        role: "model",
        text: "*soft sneeze* Do not speak too loudly. I am resting on this cashmere shawl. What is it, mortal?",
        catPhonetics: "Zzz... mew.",
        timestamp: new Date()
      }
    ],
    Sphynx: [
      {
        id: "x1",
        role: "model",
        text: "Chirrup! *shivers* Human, sit down immediately so I can steal your lower back heat. We will chat after.",
        catPhonetics: "Chirrup! *shivers*",
        timestamp: new Date()
      }
    ]
  });

  // Dynamic Right-Sidebar meters (hunger, affection, anxiety) responsive to events
  const [hungerLevel, setHungerLevel] = useState(40);
  const [affectionLevel, setAffectionLevel] = useState(75);
  const [anxietyLevel, setAnxietyLevel] = useState(20);

  // References and interval trackers for live microphone capturing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  // Trigger synthesized audio meow in the user's browser using Web Audio!
  const playSynthesizedMeowSound = (pitch: number, duration: number, type: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Cat meows sound mostly triangle/soft vocal flute-like
      osc.type = "triangle";
      
      const now = ctx.currentTime;
      
      // Map multiplier tweak based on choice
      let pMultiplier = 1.0;
      if (synthVoiceTimbre === "fluffy") pMultiplier = 1.4; // baby meow
      if (synthVoiceTimbre === "sleepy") pMultiplier = 0.8; // sluggish meow
      if (synthVoiceTimbre === "angry") pMultiplier = 0.6; // deeper growl
      
      const basePitch = pitch * pMultiplier;
      
      // Classic feline pitch curve: starts at nominal pitch, rises briefly, sweeps down
      osc.frequency.setValueAtTime(basePitch, now);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 1.2, now + duration * 0.25);
      osc.frequency.exponentialRampToValueAtTime(basePitch * 0.85, now + duration);
      
      // Volume shaping
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.linearRampToValueAtTime(type === "screaming" ? 0.3 : 0.15, now + duration * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      
      // If vibrating style, hook vibrato low-frequency oscillator
      if (type === "yowl" || type === "screaming" || simVibrato) {
        const vibratoOsc = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibratoOsc.frequency.value = 7.5; // 7.5Hz vibration
        vibratoGain.gain.value = 35; // depth of modulation
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibratoOsc.start(now);
        vibratoOsc.stop(now + duration);
      }
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn("Could not play synthesized sound:", e);
    }
  };

  // Keyboard instrument synthesis keys "C-A-T-S" to play funny meows directly!
  const playCustomKeyboardNote = (hz: number) => {
    playSynthesizedMeowSound(hz, 0.4, "normal");
  };

  // Live microphone parsing
  const stopMicrophoneInput = () => {
    setIsRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    
    // Automatically fill simulated results with some live variation
    const durationCount = (Date.now() - recordingStartTimeRef.current) / 1000;
    const finalDuration = Math.min(Math.max(durationCount, 0.3), 3.0);
    setMicDuration(Number(finalDuration.toFixed(1)));
    
    // Auto-update acoustic params in slider too
    const tempPitch = Math.floor(Math.random() * 400) + 400; // 400 - 800 Hz
    setSimPitch(tempPitch);
    setSimDuration(Number(finalDuration.toFixed(1)));
  };

  const startMicrophoneInput = async () => {
    try {
      setIsRecording(true);
      setMicPitch(null);
      recordingStartTimeRef.current = Date.now();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLoop = () => {
        if (!isRecording && !analyserRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        
        // Map to amplitude array for visuals
        const amplitudeLevels = Array.from(dataArray)
          .slice(0, 16)
          .map(val => Math.max(val / 2.5, 4));
        setAmplitudeData(amplitudeLevels.length ? amplitudeLevels : new Array(16).fill(6));
        
        // Find loudest frequency peak bin to simulate 'pitch tracking'
        let maxVal = 0;
        let peakBin = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxVal) {
            maxVal = dataArray[i];
            peakBin = i;
          }
        }
        
        // Calculate frequency
        const stepHz = ctx.sampleRate / analyser.fftSize;
        const currentPeakHz = Math.floor(peakBin * stepHz);
        if (maxVal > 40 && currentPeakHz > 150 && currentPeakHz < 1500) {
          setMicPitch(currentPeakHz);
        }
        
        setMicDuration(Number(((Date.now() - recordingStartTimeRef.current) / 1000).toFixed(1)));
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      console.error("Microphone access failed:", err);
      alert("Microphone could not start. You can still use the Feline Acoustic Simulator Sliders below!");
      setIsRecording(false);
    }
  };

  // Button handlers hitting the express endpoints
  const handleAnalyzeMeowEmotions = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze/meow-emotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pitch: micPitch || simPitch,
          duration: micDuration || simDuration,
          vibrato: simVibrato,
          volumeProgress: simVolumePattern,
          environmentalContext: simContext
        })
      });
      
      const rawData = await response.json();
      if (!response.ok || rawData.error) {
        throw new Error(rawData.error || "Failed to analyze meow emotions");
      }

      const data = rawData as FelineEmotionAnalysisResponse;
      setAnalysisResult(data);

      const emotion = data.emotion || "seeking attention";

      // Adjust right sidebar metrics according to feline emotion
      if (emotion === "hungry") {
        setHungerLevel(92);
        setAffectionLevel(45);
        setAnxietyLevel(55);
      } else if (emotion === "happy") {
        setHungerLevel(15);
        setAffectionLevel(98);
        setAnxietyLevel(5);
      } else if (emotion === "playful") {
        setHungerLevel(40);
        setAffectionLevel(80);
        setAnxietyLevel(15);
      } else if (emotion === "anxious") {
        setHungerLevel(50);
        setAffectionLevel(25);
        setAnxietyLevel(88);
      } else {
        // seeking attention
        setHungerLevel(30);
        setAffectionLevel(65);
        setAnxietyLevel(20);
      }

      // Add to sidebar logs list
      const newLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Analysis",
        title: `AI Meow Diagnostic (${emotion})`,
        subtitle: `Pitch: ${(data.acousticMetricsParsed?.avgPitchHz) || simPitch}Hz • Duration: ${(data.acousticMetricsParsed?.lengthSeconds) || simDuration}s`,
        text: `"${data.translation || "Indeterminate vocal pattern translation."}"`,
        emotion: emotion
      };
      setLogs(prev => [newLog, ...prev]);

    } catch (err: any) {
      console.error(err);
      // Insert a friendly diagnostic log to user instead of crashing
      const newLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Analysis",
        title: `AI Diagnostic Warning`,
        subtitle: `Acoustic Match Offline`,
        text: `"${err.message || "Failed to analyze feline acoustic nuances."} (Linguistic server offline, using offline metrics instead.)"`,
        emotion: "anxious"
      };
      setLogs(prev => [newLog, ...prev]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSynthesizeVoice = async () => {
    if (!humanText.trim()) return;
    setIsGeneratingSynth(true);
    try {
      const response = await fetch("/api/translate/human-to-cat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: humanText })
      });
      
      const rawData = await response.json();
      if (!response.ok || rawData.error) {
        throw new Error(rawData.error || "Failed to perform translation.");
      }

      const data = rawData as HumanToCatResponse;
      setSynthResult(data);
      
      const pitchMultiplier = data.pitchMultiplier || 1.0;
      const tempoMultiplier = data.tempoMultiplier || 1.0;
      const emotion = data.emotion || "affectionate";
      const catPhonetics = data.catPhonetics || "Mew... prrr!";

      // Auto trigger the Web Audio synthesis note sequence!
      playSynthesizedMeowSound(
        Math.floor(simPitch * pitchMultiplier),
        0.8 * tempoMultiplier,
        emotion.toLowerCase().includes("hiss") || emotion.toLowerCase().includes("screaming") ? "screaming" : "normal"
      );

      // Add to logs
      const newLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Synth",
        title: `Human → Catized Voice`,
        subtitle: `Output: ${emotion}`,
        text: `Say: "${humanText}" -> Mew: "${catPhonetics}"`,
        emotion: "happy"
      };
      setLogs(prev => [newLog, ...prev]);

    } catch (err: any) {
      console.error(err);
      const newLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: "Synth",
        title: `Translation offline`,
        subtitle: `Voice Synthesis Warning`,
        text: `"${err.message || "The meow generator ran out of yarn. Try again soon!"}"`,
        emotion: "anxious"
      };
      setLogs(prev => [newLog, ...prev]);
    } finally {
      setIsGeneratingSynth(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      text: chatInput,
      timestamp: new Date()
    };
    
    // Update active breed's chat state with user message
    const currentBreedHistory = chatsByBreed[selectedBreed];
    const updatedHistory = [...currentBreedHistory, userMsg];
    
    setChatsByBreed(prev => ({
      ...prev,
      [selectedBreed]: updatedHistory
    }));
    
    setChatInput("");
    setIsTypingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.text,
          breed: selectedBreed,
          mood: chatMood,
          history: updatedHistory.slice(-8).map(m => ({
            role: m.role,
            text: m.text
          }))
        })
      });

      const rawData = await response.json();
      if (!response.ok || rawData.error) {
        throw new Error(rawData.error || "Failed to make contact.");
      }

      const data = rawData;
      
      const kittyMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-cat",
        role: "model",
        text: data.translation || "[Licks paw] I heard you speak, but I'm electing to ignore you details for now.",
        catPhonetics: data.catPhonetics || "Meww... purr*",
        gesture: data.gesture || "Rolls lazily onto back and stares at the ceiling",
        timestamp: new Date()
      };

      setChatsByBreed(prev => ({
        ...prev,
        [selectedBreed]: [...updatedHistory, kittyMsg]
      }));

      // Play matching tone automatically!
      let playPitch = 600;
      if (selectedBreed === "Persian") playPitch = 380;
      if (selectedBreed === "Siamese") playPitch = 950;
      if (selectedBreed === "Sphynx") playPitch = 700;

      playSynthesizedMeowSound(playPitch, 0.6, chatMood === "Annoyed" ? "yowl" : "normal");

    } catch (err: any) {
      console.error(err);
      const errorKittyMsg: ChatMessage = {
        id: "msg-" + Date.now() + "-error",
        role: "model",
        text: `*Ear twitch* Error: "${err.message || "My translator went to fetch a mouse."}" But don't worry, I still expect some head scratches!`,
        catPhonetics: "Grrr-rowwl-error...",
        gesture: "Nudges your hand demandingly",
        timestamp: new Date()
      };

      setChatsByBreed(prev => ({
        ...prev,
        [selectedBreed]: [...updatedHistory, errorKittyMsg]
      }));
    } finally {
      setIsTypingChat(false);
    }
  };

  // Helper to load a past log back into interface
  const loadLogIntoInterface = (log: any) => {
    if (log.type === "Analysis") {
      setActiveTab("analyze");
      setSimPitch(parseInt(log.subtitle.match(/\d+/) || "550"));
    }
  };

  // Simulated spectrogram bars rendering
  useEffect(() => {
    if (!isRecording) {
      const interval = setInterval(() => {
        setAmplitudeData(prev => prev.map(() => Math.floor(Math.random() * 28) + 6));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-x-hidden antialiased select-none selection:bg-indigo-500/30 selection:text-white">
      
      {/* Top Header Navigation */}
      <nav className="h-16 border-b border-slate-800/80 flex items-center justify-between px-4 sm:px-8 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-rose-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] animate-pulse">
            <span className="text-white font-extrabold text-base tracking-widest">🐾</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
              Feline<span className="text-indigo-400">AI</span>
              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">LIVE</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Acoustic Emotion Synthesizer</span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800/60 rounded-full text-[11px] font-semibold border border-slate-700/60 text-indigo-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
            Model Suite Activated • v2.4
          </div>
          
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded-xl bg-slate-800/20 transition hover:bg-slate-800"
          >
            Settings
          </a>
        </div>
      </nav>

      {/* Main Full-stack Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto lg:h-[calc(100vh-4rem)]">
        
        {/* LEFT COLUMN: Interaction Log Archive */}
        <aside className="col-span-1 lg:col-span-3 bg-slate-900/30 lg:border-r border-slate-800/80 p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Interaction History
            </h3>
            <span className="text-[10px] font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
              {logs.length} archived
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => loadLogIntoInterface(log)}
                className={`p-3 rounded-xl border transition-all text-left group cursor-pointer ${
                  log.id.startsWith("log-")
                    ? "bg-slate-900/60 hover:bg-slate-800/50 border-slate-800/60"
                    : "bg-slate-800/20 hover:bg-slate-840/10 border-transparent"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                    log.type === "Analysis" 
                      ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" 
                      : "text-indigo-450 bg-indigo-500/10 border border-indigo-500/20"
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mt-1">{log.title}</h4>
                <p className="text-[11px] text-slate-400 italic font-mono mt-1 w-full truncate">{log.subtitle}</p>
                <p className="text-[12px] text-slate-350 line-clamp-2 mt-2 leading-snug">{log.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-indigo-600/5 rounded-2xl border border-indigo-500/10 text-left">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Professional Insight
            </p>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Felines vocalize predominantly to communicate with humans. Adjust pitch levels to discover subtle acoustic modulations.
            </p>
          </div>
        </aside>

        {/* CENTER COLUMN: Central AI Control Terminal */}
        <section className="col-span-1 lg:col-span-6 flex flex-col p-4 sm:p-6 bg-slate-950 overflow-y-auto">
          
          {/* Main Control Mode Toggles */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 bg-slate-900 border border-slate-850 rounded-full shadow-inner max-w-full overflow-x-auto whitespace-nowrap">
              <button
                id="tab-analyze"
                onClick={() => setActiveTab("analyze")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "analyze"
                    ? "bg-indigo-600 font-extrabold text-white shadow-lg shadow-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Meow Acoustic Analyzer
              </button>
              <button
                id="tab-synth"
                onClick={() => setActiveTab("synth")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "synth"
                    ? "bg-gradient-to-r from-indigo-600 to-rose-600 font-extrabold text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                Speech to Cat Synth
              </button>
              <button
                id="tab-chat"
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === "chat"
                    ? "bg-rose-600 font-extrabold text-white shadow-md shadow-rose-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Kitty Breed Chat
              </button>
            </div>
          </div>

          {/* TAB 1: MEOW NUANCE RECOGNITION & SPECTOGRAM */}
          {activeTab === "analyze" && (
            <div className="flex-1 flex flex-col gap-6" id="view-analyze">
              
              {/* Dynamic Oscilloscope Spectrogram Visualization Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-3 left-4 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-ping"></div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400">PITCH MONITOR (Hz)</span>
                </div>
                
                {/* Visualizer bars */}
                <div className="flex items-end justify-center gap-1 sm:gap-2 h-36 mt-4 mb-4">
                  {amplitudeData.map((val, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${val * 3.5}%` }}
                      className={`w-2.5 rounded-full transition-all duration-150 ${
                        isRecording 
                          ? "bg-gradient-to-t from-rose-500 to-indigo-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                          : "bg-gradient-to-t from-slate-700 to-indigo-500"
                      }`}
                    ></div>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <div className="text-left">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Pitch</span>
                    <span className="text-xl font-bold font-mono tracking-tight text-white">
                      {isRecording && micPitch ? `${micPitch} Hz` : !isRecording ? `${simPitch} Hz` : "Listening..."}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Vocal Duration</span>
                    <span className="text-lg font-bold font-mono text-indigo-300">
                      {isRecording ? `${micDuration}s` : `${simDuration}s`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Circular Listen / Drive Trigger */}
              <div className="text-center py-4 relative flex flex-col items-center">
                <div className="relative mb-4">
                  <div className={`absolute -inset-6 rounded-full blur-2xl transition-all duration-500 ${
                    isRecording 
                      ? "bg-rose-500/20" 
                      : "bg-indigo-500/10"
                  }`}></div>
                  
                  <button
                    id="button-record"
                    onClick={isRecording ? stopMicrophoneInput : startMicrophoneInput}
                    className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-300 ${
                      isRecording
                        ? "bg-rose-600 hover:bg-rose-500 border-white/20 animate-pulse text-white shadow-[0_0_35px_rgba(244,63,94,0.5)]"
                        : "bg-indigo-600 hover:bg-indigo-500 border-indigo-500/40 text-slate-100 shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:scale-105"
                    }`}
                  >
                    <Mic className="w-8 h-8 mb-1" />
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                      {isRecording ? "Tap Stop" : "Tap Mic"}
                    </span>
                  </button>
                </div>
                
                <p className="text-xs font-semibold text-slate-400 font-mono tracking-wider animate-pulse">
                  {isRecording ? "🔴 RECORDING RAW MEOW NUANCE AUDIO..." : "OVERRIDE WITH SIMULATION CONTROLS BELOW"}
                </p>
              </div>

              {/* Interactive Feline Acoustic Simulator controls */}
              <div className="bg-slate-900/30 border border-slate-850/80 rounded-3xl p-5 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Acoustic Nuance Override Sim
                  </span>
                  <button 
                    onClick={() => {
                      setSimPitch(550);
                      setSimDuration(0.8);
                      setSimVibrato(false);
                      setSimVolumePattern("Standard parabolic peak");
                    }}
                    className="text-[10px] text-slate-500 hover:text-slate-350 flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pitch slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Fundamental Frequency (Pitch)</span>
                      <span className="text-white font-mono font-bold">{simPitch} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="1200"
                      value={simPitch}
                      onChange={(e) => setSimPitch(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold leading-none">
                      <span>Low (Yowl / Growl)</span>
                      <span>High (Chirp / Alarm)</span>
                    </div>
                  </div>

                  {/* Duration Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Vocal Duration Profile</span>
                      <span className="text-white font-mono font-bold">{simDuration}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={simDuration}
                      onChange={(e) => setSimDuration(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold leading-none">
                      <span>0.2s (Short peep)</span>
                      <span>3.0s (Long wail)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Vibrato Index & Environment */}
                  <div className="flex items-center justify-between p-3 bg-slate-800/20 border border-slate-800/40 rounded-2xl">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-300">Wavering Pitch (Vibrato Trill)</span>
                      <span className="text-[10px] text-slate-500">Fast acoustic waver on meow envelope</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simVibrato}
                        onChange={(e) => setSimVibrato(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-semibold">Volume Amplitude Envelope</label>
                    <select
                      value={simVolumePattern}
                      onChange={(e) => setSimVolumePattern(e.target.value)}
                      className="w-full bg-slate-800/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    >
                      <option value="Slight rise, soft release">Medium rise, slow decay</option>
                      <option value="Sharp initial peak, abrupt drop">Bell-curve sudden drop</option>
                      <option value="Uniform flat drone constant">Flat uniform drony swell</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">Environmental Context & Clues</label>
                  <select
                    value={simContext}
                    onChange={(e) => setSimContext(e.target.value)}
                    className="w-full bg-slate-800/40 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="Looking at empty food bowl">Looking intensely at empty cereal/tuna bowl</option>
                    <option value="Staring at blank wall void">Staring blankly at empty wall corner (ghost alert)</option>
                    <option value="Running in circles with wide eyes">Sprinting sideways under the desk (Zoomies mode)</option>
                    <option value="Standing directly on owner's chest at 3 AM">Standing heavy-pawed on your neck at 3 AM</option>
                    <option value="Scratched by window looking outside">Chattering teeth watching a cardinal on a tree branch</option>
                  </select>
                </div>

                <button
                  id="button-analyze"
                  onClick={handleAnalyzeMeowEmotions}
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-rose-600 hover:opacity-90 disabled:opacity-40 rounded-2xl text-xs font-extrabold tracking-widest text-white uppercase transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      PROCESSING ACOUSTIC SIGNALS...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 animate-pulse" />
                      LAUNCE AI SPECTRUM NUANCE DIAGNOSTICS
                    </>
                  )}
                </button>
              </div>

              {/* FLOATING TRANSLATION SUBTITLE CARD */}
              {analysisResult && (
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl shadow-2xl flex flex-col md:flex-row items-start md:items-center gap-4 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/90 flex flex-col items-center justify-center text-3xl shrink-0 border border-slate-700/50 shadow-inner">
                    {analysisResult.emotion === "happy" ? "🌸" : 
                     analysisResult.emotion === "hungry" ? "🍣" : 
                     analysisResult.emotion === "playful" ? "🧶" : 
                     analysisResult.emotion === "anxious" ? "🙀" : "👑"}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">AI ACOUSTIC DIAGNOSTIC</span>
                        <span className="text-[10px] bg-indigo-550/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black uppercase">
                          {analysisResult.emotion}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        Confidence: {analysisResult.confidence}%
                      </span>
                    </div>

                    <p className="text-base font-extrabold text-white leading-snug tracking-wide">
                      &ldquo;{analysisResult.translation}&rdquo;
                    </p>
                    
                    <p className="text-xs text-slate-400 leading-relaxed font-sans pb-1">
                      <span className="text-indigo-300 font-bold">Bioacoustic Basis:</span> {analysisResult.explanation}
                    </p>

                    <div className="text-[11px] bg-rose-500/5 border border-rose-500/15 rounded-xl p-2.5 text-rose-300 leading-snug">
                      <strong className="text-rose-400 uppercase tracking-wide text-[10px] block mb-0.5">Strict Servant Obligation:</strong>
                      {analysisResult.actionItem}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPEECH-TO-CAT SYNTHESIZER VOICE BOX */}
          {activeTab === "synth" && (
            <div className="flex-1 flex flex-col gap-6" id="view-synth">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 text-left relative overflow-hidden">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-800/60">
                  <Volume2 className="w-4 h-4 text-rose-500" />
                  Hum-to-Feline Voice Modulator
                </h3>
                
                <p className="text-xs text-slate-450 leading-relaxed mb-4 font-medium">
                  Type what you want to tell your feline companion. FelineAI will translate standard syntax patterns to the phonetic sound-beats of domestic felines and synthesize real meows.
                </p>

                {/* Suggestions Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {HUMAN_PHRASES.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHumanText(phrase)}
                      className="text-[11px] bg-slate-800/50 hover:bg-slate-800 text-slate-350 hover:text-white px-3 py-1.5 rounded-xl transition duration-150 border border-slate-700/40 text-left truncate max-w-full"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={humanText}
                      onChange={(e) => setHumanText(e.target.value)}
                      placeholder="e.g., Get off the refrigerator and stop biting my homework!"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-rose-500 h-28 resize-none placeholder:text-slate-600 font-sans tracking-wide leading-relaxed"
                    />
                    {humanText && (
                      <button
                        onClick={() => setHumanText("")}
                        className="absolute right-3 bottom-4 text-xs text-slate-500 hover:text-slate-300 font-bold scale-105"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Synth Timbre Modifier Selection */}
                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Choose Voice Shift Timbre
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(["standard", "fluffy", "sleepy", "angry"] as const).map((timbre) => (
                        <button
                          key={timbre}
                          onClick={() => setSynthVoiceTimbre(timbre)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition border ${
                            synthVoiceTimbre === timbre
                              ? "bg-rose-500/10 text-rose-450 border-rose-500/30 font-black shadow-inner"
                              : "bg-slate-900 text-slate-400 border-transparent hover:bg-slate-800/50"
                          }`}
                        >
                          {timbre === "standard" ? "🐱 Normal" : 
                           timbre === "fluffy" ? "🍼 Kitten" : 
                           timbre === "sleepy" ? "😴 Sleepy" : "😤 Growly"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSynthesizeVoice}
                    disabled={isGeneratingSynth || !humanText.trim()}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 to-indigo-650 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:scale-100 rounded-2xl text-xs font-extrabold tracking-widest text-white uppercase font-mono flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.15)]"
                  >
                    {isGeneratingSynth ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        TRANSLATING SYNTAX & TUNING SINUS WAVE...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-rose-350" />
                        Translate and Vocally Synthesize
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Synthesized Output Box & Interactive Beat Instrument Keys */}
              {synthResult && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                      AUDIO SPECTRUM MEOW OUTPUT
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Shift multiplier: {synthResult.pitchMultiplier}x
                    </span>
                  </div>

                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs text-indigo-400 font-bold block">Vocally Synthesized Phonetics:</span>
                      <p className="text-lg font-black font-mono tracking-wide text-white">
                        {synthResult.catPhonetics}
                      </p>
                    </div>
                    <button
                      onClick={() => playSynthesizedMeowSound(440, 0.7, "normal")}
                      className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] shrink-0"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                      <span className="text-slate-550 block font-bold text-[9px] uppercase tracking-wider">Identified Mood</span>
                      <span className="text-white font-bold block mt-1">{synthResult.emotion}</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                      <span className="text-slate-550 block font-bold text-[9px] uppercase tracking-wider">Accompanying Gesture</span>
                      <span className="text-white italic block mt-1">{synthResult.gesture}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* BONUS BEAT INSTRUMENT KEYBOARD PANEL */}
              <div className="bg-slate-900/20 border border-slate-850 rounded-3xl p-5 text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  🐾 Meow Beat Composers
                </span>
                <p className="text-[11px] text-slate-500 mb-4 font-medium">
                  Compose custom chords or test key triggers. Tap individual sound keys to play pure feline frequency bursts:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { key: "C3", hz: 261, label: "Deep Purr" },
                    { key: "E3", hz: 329, label: "Growl" },
                    { key: "G3", hz: 392, label: "Angry Yowl" },
                    { key: "C4", hz: 523, label: "Comfy Meow" },
                    { key: "E4", hz: 659, label: "Short Chirp" },
                    { key: "G4", hz: 784, label: "Happy Pip" },
                    { key: "B4", hz: 987, label: "Alarm Screech" },
                    { key: "C5", hz: 1047, label: "Extreme Kitten" }
                  ].map((note) => (
                    <button
                      key={note.key}
                      onClick={() => playCustomKeyboardNote(note.hz)}
                      className="py-3 px-1 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/40 text-center active:bg-indigo-600 transition flex flex-col items-center justify-center gap-1 group"
                    >
                      <span className="text-xs font-black font-mono text-white group-hover:text-indigo-300">{note.key}</span>
                      <span className="text-[9px] text-slate-450 truncate max-w-full scale-95 font-semibold text-center leading-none">{note.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BREED-SPECIFIC CONVERSATIONAL COMPANION */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col gap-4" id="view-chat">
              
              {/* Breed templates horizontal selectors */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {BREEDS.map((breed) => {
                  const isActive = selectedBreed === breed.name;
                  return (
                    <div
                      key={breed.name}
                      onClick={() => setSelectedBreed(breed.name)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all duration-200 select-none flex flex-col justify-between ${
                        isActive
                          ? "bg-slate-900 border-rose-500 shadow-md shadow-rose-500/10"
                          : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xl">{breed.avatar}</span>
                        {isActive && <div className="w-2 h-2 rounded-full bg-rose-500"></div>}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-100">{breed.name}</h4>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{breed.tagline}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat mood selector & Breed Bio details banner */}
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-4 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="max-w-md">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                    {selectedBreed} Breed Signature
                  </span>
                  <p className="text-[11px] text-slate-350 leading-snug">
                    {BREEDS.find(b => b.name === selectedBreed)?.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Set Mood:</span>
                  <select
                    value={chatMood}
                    onChange={(e) => setChatMood(e.target.value as CatMood)}
                    className="bg-slate-800/65 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="Curious">😻 Curious</option>
                    <option value="Cuddly">🥰 Cuddly</option>
                    <option value="Zoomies">⚡ Zoomies</option>
                    <option value="Hangry">🍖 Hangry</option>
                    <option value="Annoyed">😒 Annoyed</option>
                  </select>
                </div>
              </div>

              {/* CHAT MESSENGER BOX FEED */}
              <div className="bg-slate-900/30 border border-slate-800 rounded-3xl flex-1 flex flex-col min-h-[300px] max-h-[460px] overflow-hidden">
                
                {/* Chat header status block */}
                <div className="h-11 border-b border-slate-800 px-4 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <span className="text-xs font-bold text-slate-300">
                      Line to your {selectedBreed} Friend
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-450 font-bold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ONLINE
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatsByBreed[selectedBreed].map((msg) => {
                    const isUser = msg.role === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isUser ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        {/* Speaker label */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {isUser ? "You (Human Servant)" : `${selectedBreed} Lord`}
                          </span>
                        </div>

                        {/* Speech Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm text-left leading-relaxed ${
                            isUser
                              ? "bg-indigo-650 text-white rounded-tr-none"
                              : "bg-slate-800 text-slate-200 border border-slate-750 rounded-tl-none space-y-1.5 shadow-md"
                          }`}
                        >
                          {/* Feline vocal prefix */}
                          {!isUser && msg.catPhonetics && (
                            <div className="bg-rose-500/10 text-rose-400 font-black font-mono border border-rose-500/20 px-2 py-0.5 rounded text-[11px] inline-block mb-1 p-1">
                              {msg.catPhonetics}
                            </div>
                          )}
                          
                          <p className="font-sans font-medium">{msg.text}</p>
                          
                          {/* Feline custom actions/gestures */}
                          {!isUser && msg.gesture && (
                            <span className="block text-[11px] text-indigo-300 italic">
                              * {msg.gesture} *
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTypingChat && (
                    <div className="flex flex-col mr-auto items-start max-w-[85%]">
                      <span className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                        {selectedBreed} is typing...
                      </span>
                      <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 border border-slate-750">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input action container */}
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                    placeholder={`Tell your ${selectedBreed} whatever is on your mind...`}
                    className="flex-1 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={!chatInput.trim() || isTypingChat}
                    className="w-11 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition disabled:opacity-45 shrink-0 shadow-lg shadow-rose-950/50"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Feline Analytics & Servant Action Checklist */}
        <aside className="col-span-1 lg:col-span-3 bg-slate-900/30 lg:border-l border-slate-800/80 p-4 sm:p-6 flex flex-col h-full overflow-y-auto">
          
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            Active Mood Analytics
          </h3>

          <div className="space-y-6 text-left">
            {/* Hunger Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">🥩 Hunger Quotient</span>
                <span className="text-white font-mono font-bold">{hungerLevel}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                <div
                  style={{ width: `${hungerLevel}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    hungerLevel > 80 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-indigo-500"
                  }`}
                ></div>
              </div>
            </div>

            {/* Affection Level Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">❤️ Affection Index</span>
                <span className="text-white font-mono font-bold">{affectionLevel}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                <div
                  style={{ width: `${affectionLevel}%` }}
                  className="h-full bg-rose-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                ></div>
              </div>
            </div>

            {/* Anxiety Status Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1">⚡ Energy & Anxiety</span>
                <span className="text-white font-mono font-bold">{anxietyLevel}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-850">
                <div
                  style={{ width: `${anxietyLevel}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    anxietyLevel > 70 ? "bg-rose-600 shadow-[0_0_8px_#e11d48]" : "bg-emerald-500"
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* Bioacoustic Spectrum Diagnostic breakdown */}
          <div className="mt-8 text-left">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Acoustic Diagnostic Metrics
            </h3>
            
            <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-3 font-mono text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Peak Frequency</span>
                <span>{micPitch || simPitch} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Audio Envelope</span>
                <span>{simVolumePattern.slice(0, 15)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vibrato State</span>
                <span className={simVibrato ? "text-indigo-400" : "text-slate-400"}>
                  {simVibrato ? "ACTIVE (Chattering)" : "STABLE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Context Weight</span>
                <span>0.94 Alpha</span>
              </div>
            </div>
          </div>

          {/* Servant Binding Obligations checklist */}
          <div className="mt-8 text-left flex-1 flex flex-col">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
              Servant Duty Binder
            </h3>

            <div className="space-y-3 flex-1">
              {[
                { task: "Serve half can of mackerel pate immediately", done: hungerLevel > 70 },
                { task: "Apply slow chin scratch sequence for 3 mins", done: affectionLevel > 90 },
                { task: "Throw crisp paper bag or laser on floor", done: anxietyLevel > 80 },
                { task: "Allow feline to take over office chair", done: true }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 bg-slate-800/10 border border-slate-800/40 rounded-xl"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    item.done 
                      ? "bg-indigo-600 border-indigo-500 text-white font-black text-[9px]" 
                      : "bg-slate-950 border-slate-850"
                  }`}>
                    {item.done && "✓"}
                  </div>
                  <span className={`text-[11px] leading-snug font-medium ${
                    item.done ? "text-slate-500 line-through" : "text-slate-350"
                  }`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <button
                onClick={() => {
                  alert("Session logs successfully exported to KittyCloud Secure Storage.");
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700/50"
              >
                Export Diagnostics Session Log
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
