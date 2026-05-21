import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Upload, FileText, Settings, Play, Award, Zap, Cpu, 
  MessageSquare, User, Flame, ArrowRight, ShieldCheck, 
  RefreshCw, CheckCircle, Volume2, Mic, MicOff, Star, ShieldAlert,
  Sun, Moon, Home, BarChart2, Compass, Layers, Check
} from 'lucide-react';

import WebcamHUD from './components/WebcamHUD';
import AudioVisualizer from './components/AudioVisualizer';
import MonacoEditorComponent from './components/MonacoEditor';
import RoadmapNode from './components/RoadmapNode';
import MentorChat from './components/MentorChat';
import AnalyticsDashboard from './components/AnalyticsDashboard';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function App() {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState('light');
  
  // Navigation Router state: 'resume' | 'setup' | 'interview' | 'feedback'
  const [step, setStep] = useState('resume');
  
  // User Profile Gamification
  const [streak, setStreak] = useState(4);
  const [xp, setXp] = useState(1950);
  const [userLevel, setUserLevel] = useState(2);
  const [achievements, setAchievements] = useState([
    { id: 1, name: "Clear Speaker", desc: "Record a response over 100 words in voice mode", unlocked: true },
    { id: 2, name: "ATS Decoded", desc: "Pass resume analysis with > 80 score", unlocked: false },
    { id: 3, name: "Constructive Review", desc: "Complete feedback audit reports", unlocked: false },
  ]);

  // Setup options
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [company, setCompany] = useState('Google');
  
  // Resume uploading
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedResume, setParsedResume] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Live Interview running metrics
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  
  // Audio Transcription and speech outputs
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState({});
  const [evaluationScores, setEvaluationScores] = useState({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Roadmap & Mentor drawer state
  const [finalRoadmap, setFinalRoadmap] = useState(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  
  const recognitionRef = useRef(null);

  // Toggle dark class on root document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Setup client side Speech Recognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onresult = (event) => {
        let interimText = '';
        let finalOutput = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalOutput += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => (prev + ' ' + finalOutput + ' ' + interimText).replace(/\s+/g, ' ').trim());
      };

      rec.onerror = (e) => {
        console.error("Speech Recognition error: ", e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Acoustic microphone decoder not supported in this browser path. Please type your answer.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Drag and drop handlings
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0]);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    setIsUploading(true);
    setUploadError("");
    
    const formData = new FormData();
    formData.append("file", resumeFile);
    formData.append("role", targetRole);

    try {
      const response = await fetch('http://localhost:8000/api/resume/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setParsedResume(data.analysis);
        setXp(prev => prev + 250);
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.85 } });
        setAchievements(prev => prev.map(a => a.id === 2 && data.analysis.ats_score > 80 ? { ...a, unlocked: true } : a));
      } else {
        setUploadError(data.detail || "Optics link failed. Check backend endpoints.");
      }
    } catch (err) {
      console.warn("Upload pipeline offline. Generating local simulation data.", err);
      // Fallback local resume analyser
      setTimeout(() => {
        const mockSkills = targetRole === "Frontend Developer" 
          ? ["React", "JavaScript", "HTML/CSS", "TypeScript", "Tailwind CSS"] 
          : ["Python", "PyTorch", "scikit-learn", "Pandas", "NLP"];
        
        const mockMissing = targetRole === "Frontend Developer"
          ? ["Next.js", "Redux Toolkit", "System Design Patterns"]
          : ["LLMs", "CUDA Computing", "Distributed Training"];

        const mockAnalysis = {
          ats_score: Math.floor(Math.random() * 15) + 78,
          parsed_skills: mockSkills,
          missing_skills: mockMissing,
          experience_summary: `Strong foundational engineering background. Proficient in executing applications with ${mockSkills.slice(0, 3).join(', ')}. Currently lacking target modern architectures: ${mockMissing.slice(0, 2).join(', ')}.`,
          key_achievements: [
            "Refactored components architecture boosting rendering speed by 25%.",
            "Designed and implemented REST data pipelines for high-traffic dashboards."
          ],
          improvements: [
            `Highlight specific project usage for terms like: '${mockMissing.join(', ')}'.`,
            "Add metric statements to demonstrate business impact rather than just tasks."
          ]
        };

        setParsedResume(mockAnalysis);
        setXp(prev => prev + 200);
      }, 1200);
    } finally {
      setIsUploading(false);
    }
  };

  const startSession = async () => {
    setIsGeneratingQuestions(true);
    
    const requestBody = {
      parsed_resume: parsedResume || { parsed_skills: [], missing_skills: [] },
      role: targetRole,
      difficulty: difficulty,
      company: company
    };

    try {
      const response = await fetch('http://localhost:8000/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswers({});
      setEvaluationScores({});
      setStep('interview');
      setTimeout(() => speakQuestion(data.questions[0].question), 800);
    } catch (err) {
      console.warn("Failed network question fetch. Loading local interview simulations.", err);
      const localPool = [
        {
          id: 1,
          type: "Technical",
          question: `Can you walk me through the key performance optimization protocols you'd implement for a high-traffic ${targetRole} application at ${company}?`,
          context: "Looking for client caching, bundle splits, loading structures, and asset loading specs."
        },
        {
          id: 2,
          type: "Behavioral",
          question: `Describe a scenario at work where you disagreed with a colleague on engineering designs. How did you resolve it and keep projects aligned?`,
          context: "Assesses conflict management, dialogue channels, compromise, and collaborative results."
        },
        {
          id: 3,
          type: "Coding",
          question: targetRole === "Frontend Developer" 
            ? "Write a JavaScript function `memoize(fn)` that caches the results of a function based on arguments. Handle variable parameter counts."
            : "Write a Python function to compute the cosine similarity matrix between an input embedding tensor [N, D] and database embeddings [M, D] without loops.",
          context: "Evaluates array memoizations, caching closures, and tensor matrix arithmetic.",
          code_boilerplate: targetRole === "Frontend Developer" 
            ? "function memoize(fn) {\n  const cache = new Map();\n  return function(...args) {\n    // Write your code here\n    \n  };\n}"
            : "import torch\n\ndef cosine_similarity_matrix(X, Y):\n    # X shape: [N, D], Y shape: [M, D]\n    pass",
          expected_output: "Passing complexity calculations and assertions check."
        },
        {
          id: 4,
          type: "HR",
          question: `Why does the corporate culture and technology trajectory at ${company} interest you for your next role?`,
          context: "Measures company knowledge, values alignment, and personal motivation structures."
        }
      ];
      setQuestions(localPool);
      setCurrentIdx(0);
      setAnswers({});
      setEvaluationScores({});
      setStep('interview');
      setTimeout(() => speakQuestion(localPool[0].question), 800);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const submitAnswer = async (typedAnswer = null) => {
    const finalAnswer = typedAnswer || transcript;
    if (!finalAnswer.trim()) {
      alert("Answer field cannot be empty. Please record or write your answer.");
      return;
    }

    setIsEvaluating(true);
    const questionObj = questions[currentIdx];
    
    setAnswers(prev => ({ ...prev, [questionObj.id]: finalAnswer }));

    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    try {
      const endpoint = questionObj.type === "Coding" ? '/api/interview/coding' : '/api/interview/evaluate';
      const bodyPayload = questionObj.type === "Coding" 
        ? { question: questionObj.question, code: finalAnswer, expected_output: questionObj.expected_output || "" }
        : { question: questionObj.question, type: questionObj.type, answer: finalAnswer, target_role: targetRole };

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const evalData = await response.json();
      setEvaluationScores(prev => ({ ...prev, [currentIdx]: evalData }));
      setXp(prev => prev + 150);
    } catch (err) {
      console.warn("Grading pipeline offline. Synthesizing grading metrics locally.", err);
      // Fallback local grading metrics
      setTimeout(() => {
        const fillerCount = (finalAnswer.match(/\b(um|like|uh|so|basically)\b/gi) || []).length;
        const mockEval = {
          technical_accuracy: Math.floor(Math.random() * 15) + 78,
          communication_quality: Math.max(60, 95 - (fillerCount * 4)),
          grammar_feedback: "Syntactic structure matches technical parameters. Articulation flow is clear.",
          tone: "Objective & Professional",
          strengths: ["Clear response composition", "Precise terminology references"],
          weaknesses: [fillerCount > 1 ? "Occasional speech fillers detected" : "Elaborate further on architectural scale-out trade-offs"],
          improvement_tips: ["Introduce deliberate brief pauses", "Structure using STAR methodology"],
          ideal_comparison: "The ideal answer structures the explanation, details caching mechanisms, details CDN distributions, and outlines trade-offs.",
          roast: "A solid response. However, you used occasional speech filler terms. Focusing on pausing deliberately will increase delivery strength.",
          confidence_score: Math.floor(Math.random() * 10) + 82,
          filler_words: { "like": fillerCount, "um": 0 },
          total_fillers: fillerCount,
          wpm: Math.floor(Math.random() * 10) + 130,
          clarity: "Clear and detailed"
        };
        setEvaluationScores(prev => ({ ...prev, [currentIdx]: mockEval }));
        setXp(prev => prev + 120);
      }, 900);
    } finally {
      setIsEvaluating(false);
      setTranscript("");
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      }
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      const nextId = currentIdx + 1;
      setCurrentIdx(nextId);
      setTimeout(() => speakQuestion(questions[nextId].question), 500);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setIsRoadmapLoading(true);
    setStep('feedback');
    
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    setStreak(prev => prev + 1);
    setXp(prev => prev + 500);

    const scoresList = Object.values(evaluationScores);
    
    const requestPayload = {
      parsed_resume: parsedResume || { parsed_skills: [], missing_skills: [] },
      interview_scores: scoresList,
      role: targetRole
    };

    try {
      const response = await fetch('http://localhost:8000/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      const data = await response.json();
      setFinalRoadmap(data);
    } catch (err) {
      console.warn("Could not generate roadmap from backend. Generating roadmap locally.", err);
      // Fallback Roadmap
      setTimeout(() => {
        const dummyRoadmap = {
          nodes: [
            {
              id: 1,
              title: "Establish REST & Async Foundations",
              description: "Build deep understandings of asynchronous networking, event loops, and non-blocking IO.",
              difficulty: "Medium",
              duration: "2 Weeks",
              resources: ["Asynchronous Programming Guide", "REST Design Patterns Manual"],
              projects: ["Develop a concurrent data scraper with concurrency locks"]
            },
            {
              id: 2,
              title: `Optimize Scaled ${targetRole} Architectures`,
              description: "Learn modular state caching, caching layouts, and CDN caching systems.",
              difficulty: "Hard",
              duration: "3 Weeks",
              resources: ["High Performance Network Architectures", "Modern Design Systems deep dive"],
              projects: ["Architect a globally distributed state visualizer module"]
            }
          ],
          recommended_certification: `Professional ${targetRole} Certification`,
          ready_score: Math.floor(Math.random() * 10) + 80
        };
        setFinalRoadmap(dummyRoadmap);
      }, 1000);
    } finally {
      setIsRoadmapLoading(false);
      setAchievements(prev => prev.map(a => a.id === 3 ? { ...a, unlocked: true } : a));
    }
  };

  return (
    <div className="min-h-screen bg-saas-bg dark:bg-dark-bg text-saas-text dark:text-dark-text flex flex-col md:flex-row font-sans selection:bg-saas-indigo/10 transition-colors duration-300">
      
      {/* 1. PERSISTENT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white dark:bg-dark-card border-b md:border-b-0 md:border-r border-saas-border dark:border-dark-border flex flex-col justify-between p-5 z-20 flex-shrink-0">
        <div className="flex flex-col gap-6">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 px-1 py-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-saas-indigo to-saas-violet text-white flex items-center justify-center font-extrabold shadow-sm">
              <Cpu className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-saas-slate900 dark:text-white leading-none">Elevate AI</span>
              <span className="text-[10px] text-saas-muted dark:text-dark-muted font-semibold mt-1">Interview Platform</span>
            </div>
          </div>

          {/* Gamified User Status */}
          <div className="p-3.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg/60 border border-saas-border dark:border-dark-border flex flex-col gap-2 font-mono text-[11px] font-semibold text-saas-slate700 dark:text-dark-muted">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-saas-muted">User Rank</span>
              <span className="text-saas-indigo">LEVEL {userLevel}</span>
            </div>
            <div className="w-full h-1 bg-saas-slate200 dark:bg-saas-slate800 rounded-full overflow-hidden">
              <div className="h-full bg-saas-indigo" style={{ width: `${(xp % 1000) / 10}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10px] mt-0.5">
              <span>{xp} XP</span>
              <span className="flex items-center gap-1 text-saas-rose">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                {streak} DAY STREAK
              </span>
            </div>
          </div>

          {/* Sidebar Menu items */}
          <nav className="flex flex-col gap-1 text-xs font-semibold">
            <button 
              onClick={() => { setStep('resume'); setQuestions([]); }}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
                step === 'resume' 
                  ? 'bg-saas-slate100 dark:bg-saas-slate850 text-saas-indigo dark:text-white' 
                  : 'text-saas-muted hover:text-saas-slate900 dark:hover:text-white hover:bg-saas-slate50 dark:hover:bg-saas-slate900'
              }`}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            
            <button 
              onClick={() => { if(parsedResume) setStep('setup'); }}
              disabled={!parsedResume}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 ${
                step === 'setup' 
                  ? 'bg-saas-slate100 dark:bg-saas-slate850 text-saas-indigo dark:text-white' 
                  : 'text-saas-muted hover:text-saas-slate900 dark:hover:text-white hover:bg-saas-slate50 dark:hover:bg-saas-slate900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Configure Mock
            </button>

            <button 
              disabled={questions.length === 0}
              onClick={() => setStep('interview')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 ${
                step === 'interview' 
                  ? 'bg-saas-slate100 dark:bg-saas-slate850 text-saas-indigo dark:text-white' 
                  : 'text-saas-muted hover:text-saas-slate900 dark:hover:text-white hover:bg-saas-slate50 dark:hover:bg-saas-slate900'
              }`}
            >
              <Layers className="w-4 h-4" />
              Active Simulation
            </button>

            <button 
              disabled={Object.keys(evaluationScores).length === 0}
              onClick={() => setStep('feedback')}
              className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all disabled:opacity-50 ${
                step === 'feedback' 
                  ? 'bg-saas-slate100 dark:bg-saas-slate850 text-saas-indigo dark:text-white' 
                  : 'text-saas-muted hover:text-saas-slate900 dark:hover:text-white hover:bg-saas-slate50 dark:hover:bg-saas-slate900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Analytics & Roadmap
            </button>
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-2.5 pt-4 border-t border-saas-border dark:border-dark-border">
          <button 
            onClick={() => setIsMentorOpen(!isMentorOpen)}
            className="w-full py-2 bg-saas-indigo text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all hover:bg-saas-indigo/90 shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Mentor AI Advisor
          </button>

          {/* Theme switcher */}
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full py-2 bg-saas-slate100 hover:bg-saas-slate200 dark:bg-saas-slate800 dark:hover:bg-saas-slate700 text-saas-slate700 dark:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-saas-border/40 dark:border-dark-border"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5" />
                Dark Theme
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5" />
                Light Theme
              </>
            )}
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE PANEL */}
      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col justify-center min-h-[calc(100vh-60px)] md:min-h-screen">
        
        <AnimatePresence mode="wait">
          
          {/* VIEW 1: RESUME ANALYSIS & PARSING */}
          {step === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start py-2"
            >
              
              {/* Uploader Card */}
              <div className="lg:col-span-2 saas-card p-6 flex flex-col gap-5">
                <div className="border-b border-saas-border dark:border-dark-border pb-3">
                  <h2 className="text-lg font-bold text-saas-slate900 dark:text-white">
                    Resume Upload & Skill Analyzer
                  </h2>
                  <p className="text-xs text-saas-muted dark:text-dark-muted mt-1 leading-relaxed">Uplink your resume profile to scan skill alignment and run customized interview mockups.</p>
                </div>

                <form onSubmit={handleResumeUpload} className="flex flex-col gap-4">
                  {/* Select target role */}
                  <div className="flex flex-col gap-1.5 text-xs font-semibold text-saas-slate700 dark:text-white">
                    <label className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Target Interview Profile</label>
                    <select 
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="bg-saas-slate50 dark:bg-dark-bg border border-saas-border dark:border-dark-border rounded-xl px-4 py-3 text-xs text-saas-slate900 dark:text-white focus:outline-none focus:border-saas-indigo font-medium"
                    >
                      <option>Frontend Developer</option>
                      <option>AIML Engineer</option>
                      <option>Backend Developer</option>
                      <option>Product Manager</option>
                    </select>
                  </div>

                  {/* Drag drop zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-saas-slate50/40 dark:bg-dark-bg/20 relative overflow-hidden group ${
                      dragActive ? 'border-saas-indigo bg-saas-indigo/5' : 'border-saas-border dark:border-dark-border hover:border-saas-indigo/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc" 
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-saas-muted group-hover:text-saas-indigo transition-colors mb-3" />
                    
                    {resumeFile ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-saas-indigo">{resumeFile.name}</span>
                        <span className="text-[10px] text-saas-muted mt-1">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs font-semibold text-saas-slate800 dark:text-white">Drag & drop your resume file here</span>
                        <span className="text-[10px] text-saas-muted mt-1 leading-relaxed">PDF, DOCX, or DOC formats up to 10MB</span>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <div className="p-3 rounded-xl bg-saas-rose/10 border border-saas-rose/25 text-xs text-saas-rose flex items-center gap-2 font-medium">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isUploading || !resumeFile}
                    className="w-full py-3 bg-saas-indigo hover:bg-saas-indigo/90 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scanning Resume Metrics...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-saas-amber" />
                        Start Profile Scan
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Sidebar Diagnostics Column */}
              <div className="flex flex-col gap-4">
                
                {/* Parse results */}
                {parsedResume ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 saas-card border-saas-indigo/30 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-saas-border dark:border-dark-border pb-2.5">
                      <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">ATS Match Rating</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-saas-emerald/10 text-saas-emerald">
                        <Check className="w-3 h-3" />
                        Matched
                      </span>
                    </div>

                    <div className="flex items-center gap-4 py-1.5">
                      <div className="w-16 h-16 rounded-full border-4 border-saas-slate100 dark:border-saas-slate850 border-t-saas-indigo flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-saas-slate900 dark:text-white leading-none">{parsedResume.ats_score}</span>
                        <span className="text-[8px] text-saas-muted mt-0.5 font-bold uppercase">ATS</span>
                      </div>
                      <div className="flex flex-col text-xs leading-normal">
                        <span className="font-bold text-saas-slate900 dark:text-white">{targetRole}</span>
                        <span className="text-[10px] text-saas-muted mt-0.5">Found Skills: {parsedResume.parsed_skills.length}</span>
                        <span className="text-[10px] text-saas-rose font-medium mt-0.5">Missing: {parsedResume.missing_skills.length}</span>
                      </div>
                    </div>

                    {/* Skill gaps */}
                    <div className="text-xs border-t border-saas-border dark:border-dark-border pt-3">
                      <span className="text-saas-rose font-bold block mb-2">Detected Gaps</span>
                      <div className="flex flex-wrap gap-1">
                        {parsedResume.missing_skills.map((skill, index) => (
                          <span key={index} className="px-2 py-0.5 rounded-full bg-saas-rose/10 text-saas-rose text-[9px] font-semibold uppercase">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Proceed Button */}
                    <button
                      onClick={() => setStep('setup')}
                      className="mt-1 py-2.5 bg-saas-indigo hover:bg-saas-indigo/90 text-white font-semibold text-xs rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Proceed to Setup
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="p-6 saas-card border-dashed flex flex-col items-center justify-center text-center py-12 text-xs text-saas-muted">
                    <Cpu className="w-8 h-8 mb-3 text-saas-muted opacity-40" />
                    <span>Awaiting Resume Upload... Upload your credentials to analyze alignment metrics.</span>
                  </div>
                )}

                {/* Achievements List */}
                <div className="p-5 saas-card flex flex-col gap-3">
                  <span className="font-bold text-xs text-saas-slate950 dark:text-white flex items-center gap-1.5 pb-2 border-b border-saas-border dark:border-dark-border">
                    <Award className="w-4 h-4 text-saas-indigo" />
                    Milestones & Badges
                  </span>
                  <div className="flex flex-col gap-2 text-xs">
                    {achievements.map(a => (
                      <div key={a.id} className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        a.unlocked ? 'bg-saas-slate50 dark:bg-dark-bg/60 border-saas-border dark:border-dark-border text-saas-slate900 dark:text-white' : 'bg-transparent border-saas-slate100 dark:border-dark-border/40 text-saas-muted opacity-60'
                      }`}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{a.name}</span>
                          <span className="text-[9px] text-saas-muted">{a.desc}</span>
                        </div>
                        {a.unlocked && <span className="text-[10px] font-bold text-saas-emerald">UNLOCKED</span>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* VIEW 2: MOCK SETUP & PARAMETERS */}
          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="max-w-xl mx-auto p-6 md:p-8 saas-card flex flex-col gap-6"
            >
              <div className="border-b border-saas-border dark:border-dark-border pb-3 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-saas-indigo/10 text-saas-indigo border border-saas-indigo/20">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-base font-bold text-saas-slate900 dark:text-white">Mock Setup & Parameters</h2>
                  <p className="text-xs text-saas-muted dark:text-dark-muted mt-0.5">Adapt difficulty settings and choose target corporate structures.</p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {/* Level Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Interview Level</span>
                  <div className="grid grid-cols-3 gap-3">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                          difficulty === diff 
                            ? 'bg-saas-indigo/15 border-saas-indigo text-saas-indigo shadow-sm' 
                            : 'bg-saas-slate50/60 dark:bg-dark-bg/60 border-saas-border dark:border-dark-border text-saas-muted hover:text-saas-slate900 dark:hover:text-white'
                        }`}
                      >
                        {diff.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Mock Target Company</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {['Google', 'Amazon', 'OpenAI', 'Meta'].map((comp) => (
                      <button
                        key={comp}
                        onClick={() => setCompany(comp)}
                        className={`py-2 border rounded-xl font-bold transition-all duration-200 ${
                          company === comp
                            ? 'bg-saas-indigo/15 border-saas-indigo text-saas-indigo shadow-sm'
                            : 'bg-transparent border-saas-slate200 dark:border-dark-border text-saas-muted hover:text-saas-slate900 dark:hover:text-white'
                        }`}
                      >
                        {comp.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configuration Summary */}
                <div className="p-4 rounded-xl bg-saas-slate50 dark:bg-dark-bg/50 border border-saas-border dark:border-dark-border text-xs leading-relaxed text-saas-muted">
                  <span className="font-bold text-saas-slate800 dark:text-white block mb-1">Configuration parameters:</span>
                  <span>Target Role: <strong className="text-saas-indigo">{targetRole}</strong> | Company: <strong className="text-saas-indigo">{company}</strong> | Level: <strong className="text-saas-indigo">{difficulty}</strong></span>
                  <p className="mt-1.5 text-[11px] leading-relaxed">The simulation generates personalized behavioral prompts, coding challenges, and evaluates metrics in real-time.</p>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center gap-4 mt-2">
                  <button
                    onClick={() => setStep('resume')}
                    className="px-4 py-2.5 border border-saas-border dark:border-dark-border hover:bg-saas-slate100 dark:hover:bg-saas-slate850 text-saas-slate700 dark:text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Back to CV
                  </button>
                  
                  <button
                    onClick={startSession}
                    disabled={isGeneratingQuestions}
                    className="flex-grow py-2.5 bg-saas-indigo hover:bg-saas-indigo/90 text-white font-bold text-xs rounded-xl transition-all duration-300 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingQuestions ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Custom Simulation...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Live Simulation
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* VIEW 3: LIVE INTERVIEW WORKSPACE */}
          {step === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start py-2"
            >
              
              {/* HUD / Camera details */}
              <div className="flex flex-col gap-4 lg:col-span-1">
                <WebcamHUD />
                
                {/* Audio waves */}
                <div className="saas-card p-4 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider border-b border-saas-border dark:border-dark-border pb-1.5">Mic Input Level</span>
                  <AudioVisualizer isRecording={isRecording} />
                </div>

                {/* Progress bar */}
                <div className="p-4 saas-card text-xs flex flex-col gap-2">
                  <span className="text-saas-muted font-semibold">Assessment Progress</span>
                  <div className="flex items-center justify-between font-bold text-saas-slate900 dark:text-white mb-0.5">
                    <span>PROMPT {currentIdx + 1} OF {questions.length}</span>
                    <span className="text-saas-indigo">{((currentIdx + 1) / questions.length * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-saas-slate100 dark:bg-saas-slate800 overflow-hidden">
                    <div 
                      className="h-full bg-saas-indigo transition-all duration-500"
                      style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Workspace Console */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                
                {/* Question block */}
                {questions.length > 0 && (
                  <div className="p-5 saas-card flex flex-col gap-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-saas-slate100 dark:border-dark-border pb-2">
                      <span className="px-2 py-0.5 rounded-full bg-saas-indigo/10 text-saas-indigo text-[10px] font-bold uppercase">
                        {questions[currentIdx].type} PROMPT
                      </span>
                      
                      <button
                        onClick={() => speakQuestion(questions[currentIdx].question)}
                        className="p-1.5 rounded-lg bg-saas-slate100 hover:bg-saas-slate200 dark:bg-saas-slate800 dark:hover:bg-saas-slate750 text-saas-indigo dark:text-white transition-colors flex items-center gap-1.5 text-[10px] font-semibold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Listen Prompt
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Interviewer Prompt:</span>
                      <h3 className="text-base font-semibold text-saas-slate900 dark:text-white leading-relaxed">
                        {questions[currentIdx].question}
                      </h3>
                    </div>
                    
                    <div className="p-3 bg-saas-slate50 dark:bg-dark-bg/60 rounded-xl border border-saas-border dark:border-dark-border text-[11px] text-saas-muted dark:text-dark-muted leading-relaxed font-medium">
                      <strong className="text-saas-slate800 dark:text-white font-semibold">Evaluation Target:</strong> {questions[currentIdx].context}
                    </div>
                  </div>
                )}

                {/* Sub-panel swap: Coding or Voice */}
                {questions.length > 0 && questions[currentIdx].type === "Coding" ? (
                  
                  <div className="h-[430px]">
                    <MonacoEditorComponent 
                      boilerplate={questions[currentIdx].code_boilerplate || ""}
                      expectedOutput={questions[currentIdx].expected_output || ""}
                      onSubmit={(code) => submitAnswer(code)}
                      theme={theme}
                    />
                  </div>
                  
                ) : (
                  
                  <div className="p-5 saas-card flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-saas-slate100 dark:border-dark-border pb-2">
                      <span className="text-xs font-bold text-saas-slate800 dark:text-white">Voice Recorder Pane</span>
                      {isRecording && <span className="text-[10px] text-saas-rose font-semibold animate-pulse">MIC RECORDING ACTIVE</span>}
                    </div>

                    {/* Speech view */}
                    <div className="min-h-[140px] bg-saas-slate50 dark:bg-dark-bg/50 rounded-xl p-4 border border-saas-border dark:border-dark-border text-xs text-saas-slate800 dark:text-dark-text leading-relaxed relative flex flex-col justify-between">
                      {transcript ? (
                        <p className="font-medium whitespace-pre-wrap">{transcript}</p>
                      ) : (
                        <span className="text-saas-muted italic">Click 'Start Speaking' and answer the prompt using your microphone, or type your answer directly into the textarea below.</span>
                      )}
                      
                      <textarea
                        placeholder="Type answer here directly if microphone access is unavailable..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        className="mt-4 w-full bg-white dark:bg-dark-card border border-saas-border dark:border-dark-border rounded-xl p-3 text-xs text-saas-slate800 dark:text-white focus:outline-none focus:border-saas-indigo font-medium placeholder:text-saas-muted/40"
                        rows={3}
                      />
                    </div>

                    {/* Recording buttons */}
                    <div className="flex justify-between items-center gap-3">
                      <button
                        onClick={toggleRecording}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                          isRecording 
                            ? 'bg-saas-rose text-white shadow-sm' 
                            : 'bg-saas-indigo/10 hover:bg-saas-indigo/20 text-saas-indigo border border-saas-indigo/30'
                        }`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {isRecording ? "Stop Transcribing" : "Start Speaking"}
                      </button>

                      <button
                        onClick={() => submitAnswer()}
                        disabled={isEvaluating}
                        className="px-5 py-2.5 bg-saas-indigo hover:bg-saas-indigo/90 text-white font-bold text-xs rounded-xl transition-all duration-300 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isEvaluating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Evaluating Speech...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Submit Answer & Analyze
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Score results per question */}
                {evaluationScores[currentIdx] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 saas-card border-saas-emerald/30 flex flex-col gap-3 text-xs font-sans"
                  >
                    <div className="flex items-center justify-between border-b border-saas-slate100 dark:border-dark-border pb-2.5">
                      <span className="text-saas-emerald font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Spoken Metric Report
                      </span>
                      <span className="text-saas-slate800 dark:text-white font-bold">Accuracy Rating: {evaluationScores[currentIdx].technical_accuracy}%</span>
                    </div>
                    
                    <p className="text-saas-muted dark:text-dark-muted leading-relaxed text-[11px] font-medium">
                      <strong className="text-saas-slate850 dark:text-white font-semibold">Evaluation Summary:</strong> {evaluationScores[currentIdx].grammar_feedback}
                    </p>

                    <div className="flex justify-end gap-3 mt-1.5">
                      <button
                        onClick={nextQuestion}
                        className="px-5 py-2.5 bg-saas-indigo hover:bg-saas-indigo/90 text-white font-bold rounded-xl transition-all duration-300 shadow-sm flex items-center gap-1.5 text-xs"
                      >
                        {currentIdx === questions.length - 1 ? "Finish & Compile Roadmap" : "Next Question Prompt"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* VIEW 4: ASSESSMENT REPORT & ROADMAP */}
          {step === 'feedback' && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6 py-2"
            >
              {/* Header */}
              <div className="border-b border-saas-border dark:border-dark-border pb-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-saas-slate900 dark:text-white flex items-center gap-2">
                    <Award className="w-5.5 h-5.5 text-saas-indigo" />
                    Candidate Assessment Report
                  </h2>
                  <p className="text-xs text-saas-muted dark:text-dark-muted mt-0.5">Comprehensive audit logs of communication accuracy, speech flow, and learning roadmaps.</p>
                </div>

                <button
                  onClick={() => {
                    setStep('resume');
                    setQuestions([]);
                    setParsedResume(null);
                    setAnswers({});
                    setEvaluationScores({});
                  }}
                  className="px-4 py-2 bg-saas-slate100 hover:bg-saas-slate200 dark:bg-saas-slate800 dark:hover:bg-saas-slate700 text-saas-slate750 dark:text-white border border-saas-border dark:border-dark-border rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 self-start md:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run New Simulation
                </button>
              </div>

              {/* Analytics widgets */}
              {Object.keys(evaluationScores).length > 0 ? (
                <AnalyticsDashboard 
                  evaluationData={evaluationScores[Object.keys(evaluationScores)[0]]}
                  userAnswer={answers[questions[0]?.id]}
                  questionText={questions[0]?.question}
                />
              ) : (
                <div className="p-6 text-center saas-card text-xs text-saas-muted font-medium">No evaluation records generated.</div>
              )}

              {/* Personalized timeline roadmap */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-saas-slate900 dark:text-white flex items-center gap-2 border-b border-saas-border dark:border-dark-border pb-2.5">
                  <Zap className="w-4 h-4 text-saas-indigo" />
                  Personalized Career Development Roadmap
                </h3>
                
                {isRoadmapLoading ? (
                  <div className="p-12 text-center saas-card flex flex-col items-center justify-center gap-3 text-xs text-saas-muted font-medium">
                    <RefreshCw className="w-8 h-8 text-saas-indigo animate-spin" />
                    <span>Synthesizing custom learning roadmap timeline...</span>
                  </div>
                ) : (
                  <RoadmapNode roadmapData={finalRoadmap} />
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* AI career drawer */}
      <AnimatePresence>
        {isMentorOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 z-40 w-full max-w-sm md:max-w-md h-full flex"
          >
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-xs -left-[200vw] w-[300vw] pointer-events-auto"
              onClick={() => setIsMentorOpen(false)}
            />
            <div className="relative z-10 w-full h-full">
              <MentorChat 
                role={targetRole} 
                resumeSummary={parsedResume?.experience_summary || ""}
                onClose={() => setIsMentorOpen(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
