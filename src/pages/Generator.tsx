import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Book, Palette, Users, FileText, CheckCircle2 } from "lucide-react";
import { generateBookContent, generateImage, type GenerationRequest } from "../lib/gemini";
import { db, auth } from "../lib/firebase";
import { addDoc, collection, serverTimestamp, getDoc, doc, query, where, getDocs } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { PLANS, type PlanType } from "../constants/plans";

export default function Generator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [recentBooksCount, setRecentBooksCount] = useState(0);
  const [fetchingPlan, setFetchingPlan] = useState(true);
  const [previewManuscript, setPreviewManuscript] = useState<any[] | null>(null);
  const [previewCover, setPreviewCover] = useState<{ url?: string; prompt: string } | null>(null);
  const [previewPage, setPreviewPage] = useState(0);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<GenerationRequest>({
    type: "Motivation",
    title: "",
    theme: "",
    audience: "",
    tone: "Inspiring",
    pageCount: 5,
    wordsPerPage: 300,
  });

  const autoGenerateTitle = () => {
    if (!formData.theme) return;
    const isColoring = formData.type === "Coloring";
    const prefixes = isColoring 
      ? ["Fun with", "Coloring the World of", "My First", "Creative Adventures with"]
      : ["The Master Guide to", "The Secrets of", "Empowered:", "A Journey through"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const generatedTitle = isColoring 
      ? `${randomPrefix} ${formData.theme.split(' ').slice(0, 3).join(' ')} Coloring Book`
      : `${randomPrefix} ${formData.theme.split(' ').slice(0, 3).join(' ')}`;
    setFormData(prev => ({ ...prev, title: generatedTitle }));
  };

  useEffect(() => {
    async function fetchUserData() {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserPlan(userDoc.data().plan || 'free');
        }

        // Check recent books count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const q = query(
          collection(db, "books"),
          where("userId", "==", auth.currentUser.uid),
          where("createdAt", ">=", thirtyDaysAgo)
        );
        const snapshot = await getDocs(q);
        setRecentBooksCount(snapshot.size);
      } catch (e) {
        console.error(e);
      } finally {
        setFetchingPlan(false);
      }
    }
    fetchUserData();
  }, []);

  const limits = PLANS[userPlan];
  const canGenerate = recentBooksCount < limits.booksPerMonth;

  const handleGeneratePreview = async () => {
    if (!auth.currentUser) {
      alert("Please sign in to generate a book.");
      return;
    }

    setLoading(true);
    setLoadingStatus("Architecting your manuscript...");
    try {
      // Ensure there is a title
      let finalTitle = formData.title;
      if (!finalTitle) {
        finalTitle = `The Path to ${formData.theme || "Success"}`;
      }

      const result = await generateBookContent({ ...formData, title: finalTitle });
      
      let coverUrl = "";
      if (limits.imagesEnabled) {
        setLoadingStatus("Creating a masterpiece cover...");
        try {
          const url = await generateImage(result.coverPrompt);
          if (url) coverUrl = url;
        } catch (err) {
          console.error("Failed to generate cover:", err);
        }
      }

      // Generate AI Images for premium members
      if (limits.imagesEnabled) {
        setLoadingStatus(`Generating ${result.pages.length} AI Illustrations...`);
        const pagesWithImages = await Promise.all(
          result.pages.map(async (page) => {
            try {
              const imageUrl = await generateImage(page.imagePrompt);
              return { ...page, imageUrl };
            } catch (err) {
              console.error(`Failed to generate image for page ${page.pageNumber}:`, err);
              return page;
            }
          })
        );
        result.pages = pagesWithImages;
      }
      
      setPreviewManuscript(result.pages);
      setPreviewCover({ url: coverUrl, prompt: result.coverPrompt });
      setFormData(prev => ({ ...prev, title: finalTitle }));
      setStep(4);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#ec4899']
      });
    } catch (error) {
      console.error("Generation error:", error);
      alert("Something went wrong during generation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!auth.currentUser || !previewManuscript) return;

    setLoading(true);
    setLoadingStatus("Saving to dashboard...");
    try {
      const docRef = await addDoc(collection(db, "books"), {
        ...formData,
        userId: auth.currentUser.uid,
        status: "completed",
        manuscript: previewManuscript,
        coverUrl: previewCover?.url || "",
        coverPrompt: previewCover?.prompt || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate(`/book/${docRef.id}`);
    } catch (error) {
      console.error("Finalize error:", error);
      alert("Failed to save book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingPlan) return <div className="pt-40 text-center text-white"><Loader2 className="animate-spin inline-block mr-2" /> Loading your creative studio...</div>;

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex justify-center items-start">
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full ${step === 4 ? "max-w-4xl" : "max-w-2xl"} p-8 rounded-3xl backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl relative transition-all duration-500`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <Sparkles className="text-indigo-400" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
              {step === 4 ? "Manuscript Review" : "Book Architect"}
            </h1>
          </div>
          <div className="text-sm font-medium text-gray-500">
            Step {step} of 4
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">What are you creating today?</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["Motivation", "Success", "Money", "Children Stories", "Islamic Lifestyle", "Coloring"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, type: type as any })}
                      className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-left ${
                        formData.type === type 
                        ? "bg-indigo-600/20 border-indigo-500 text-white" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <CheckCircle2 size={18} className={formData.type === type ? "text-indigo-400" : "text-gray-700"} />
                      <span className="font-semibold text-sm">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Writing Tone</label>
                <div className="flex gap-3">
                  {["Simple", "Inspiring", "Educational"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, tone: t as any })}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                        formData.tone === t 
                        ? "bg-purple-600/20 border-purple-500 text-purple-300" 
                        : "bg-white/5 border-white/10 text-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all mt-8"
              >
                Configure Concept <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Detailed Theme / Subject</label>
                <textarea
                  placeholder="e.g. A guide on productivity for busy parents, or stories about sharing..."
                  rows={4}
                  value={formData.theme}
                  onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="block text-sm font-medium text-gray-400">Book Title (Optional)</label>
                   <button 
                    onClick={autoGenerateTitle}
                    disabled={!formData.theme}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                   >
                     Auto-Generate ✨
                   </button>
                </div>
                <input
                  type="text"
                  placeholder="Leave empty for an AI suggested title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button 
                  disabled={!formData.theme}
                  onClick={() => setStep(3)}
                  className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all"
                >
                  Finalize Limits <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Audience</label>
                <input
                  type="text"
                  placeholder="e.g. Young Professionals, Kids aged 5-8"
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <div className="flex justify-between mb-3 text-sm font-medium">
                  <label className="text-gray-400">Chapters: <span className="text-white">{formData.pageCount}</span></label>
                  <label className="text-gray-400">Word Count / Chapter: <span className="text-white">{formData.wordsPerPage}</span></label>
                </div>
                
                <div className="space-y-8">
                  {/* Chapters Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max={limits.maxChapters}
                      value={formData.pageCount}
                      onChange={(e) => setFormData({ ...formData, pageCount: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                      <span>1 Chapter</span>
                      <span>MAX: {limits.maxChapters} Chapters</span>
                    </div>
                  </div>

                  {/* Words Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="100"
                      max={limits.maxWordsPerChapter}
                      step="100"
                      value={formData.wordsPerPage}
                      onChange={(e) => setFormData({ ...formData, wordsPerPage: parseInt(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-2">
                      <span>100 Words</span>
                      <span>MAX: {limits.maxWordsPerChapter} Words</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  <ArrowLeft size={20} /> Back
                </button>
                <button 
                  disabled={loading || !formData.audience}
                  onClick={handleGeneratePreview}
                  className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)]"
                >
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Generating...</span>
                      </div>
                      <span className="text-[10px] text-indigo-300 font-mono animate-pulse">{loadingStatus}</span>
                    </div>
                  ) : (
                    <>
                       Generate Preview <Sparkles size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && previewManuscript && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Cover Preview Section */}
              {previewCover?.url && (
                <div className="mb-8 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-32 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
                    <img src={previewCover.url} className="w-full h-full object-cover" alt="Book Cover" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold mb-2">Generated Book Cover</h3>
                    <p className="text-gray-400 text-xs mb-4 italic line-clamp-2">"{previewCover.prompt}"</p>
                    <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Premium Cover Asset</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 min-h-[400px] flex flex-col relative overflow-hidden group">
                  <div className="absolute top-4 left-4 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-indigo-500/20">
                    {previewManuscript[previewPage].title || `Chapter ${previewManuscript[previewPage].pageNumber}`}
                  </div>
                  
                  <div className="mt-10 font-serif text-white/90 whitespace-pre-wrap leading-relaxed text-sm">
                    {previewManuscript[previewPage].content}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <button 
                      onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                      disabled={previewPage === 0}
                      className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-0 transition-all"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="text-[10px] font-mono text-gray-500">{previewPage + 1} / {previewManuscript.length}</span>
                    <button 
                      onClick={() => setPreviewPage(p => Math.min(previewManuscript.length - 1, p + 1))}
                      disabled={previewPage === previewManuscript.length - 1}
                      className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-0 transition-all"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {previewManuscript[previewPage].imageUrl ? (
                    <div className="rounded-3xl overflow-hidden border border-white/10 shadow-xl aspect-square">
                      <img 
                        src={previewManuscript[previewPage].imageUrl} 
                        alt="AI Illustration" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-3xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 text-gray-500 italic text-xs">
                      <Palette size={24} className="mb-2 opacity-20" />
                      No illustration generated for this chapter.
                    </div>
                  )}

                  <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                    <h4 className="text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                       Verification Mode
                    </h4>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Download is disabled in preview mode. Once satisfied, click "Publish to Library" to save this book and unlock export options.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setPreviewManuscript(null);
                    setStep(3);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold transition-all"
                >
                  Discard & Tweak
                </button>
                <button 
                  disabled={loading}
                  onClick={handleFinalize}
                  className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Finalizing...
                    </>
                  ) : (
                    <>
                       Publish to My Library <CheckCircle2 size={20} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
