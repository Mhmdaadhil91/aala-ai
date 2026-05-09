import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Download, Loader2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Printer, Book as BookIcon, Users, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PLANS, type PlanType } from "../constants/plans";

export default function BookViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id || !auth.currentUser) return;
      
      try {
        const [bookDoc, userDoc] = await Promise.all([
          getDoc(doc(db, "books", id)),
          getDoc(doc(db, "users", auth.currentUser.uid))
        ]);

        if (bookDoc.exists()) {
          setBook(bookDoc.data());
        } else {
          navigate("/dashboard");
        }

        if (userDoc.exists()) {
          setUserPlan(userDoc.data().plan || 'free');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const limits = PLANS[userPlan];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { margin: 0.5in; size: ${["Coloring", "Children Stories"].includes(book.type) ? "8.5in 11in" : "6in 9in"}; }
            body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .page { page-break-after: always; display: flex; flex-direction: column; justify-content: center; min-height: 100vh; padding: 40px; box-sizing: border-box; }
            .page img { width: 100%; border-radius: 10px; margin-bottom: 30px; max-height: 5in; object-fit: contain; }
            .page-number { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
            h1 { text-align: center; margin-bottom: 30px; font-size: 24px; color: #111; }
            .content { font-size: 16px; text-align: justify; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          ${book.coverUrl ? `
            <div class="page" style="padding: 0; display: flex; align-items: center; justify-content: center; background: #000;">
              <img src="${book.coverUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0; margin-bottom: 0;" />
            </div>
          ` : ''}
          ${book.manuscript.map((p: any) => `
            <div class="page">
              ${p.imageUrl ? `<img src="${p.imageUrl}" />` : ''}
              <h1>${p.title || `Chapter ${p.pageNumber}`}</h1>
              <div class="content">${p.content}</div>
              <div class="page-number">Page ${p.pageNumber}</div>
            </div>
          `).join("")}
        </body>
        </html>
      `;

      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          htmlContent,
          options: {
            width: ["Coloring", "Children Stories"].includes(book.type) ? "8.5in" : "6in",
            height: ["Coloring", "Children Stories"].includes(book.type) ? "11in" : "9in"
          }
        })
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title}_Manuscript.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export PDF. Please check server connection.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="pt-40 text-center text-white"><Loader2 className="animate-spin inline-block mr-2" /> Loading manuscript...</div>;
  if (!book) return null;

  const currentManuscriptPage = book.manuscript[currentPage];

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-end gap-6 mb-12">
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-3 text-indigo-400 text-sm font-bold mb-2 uppercase tracking-widest">
            <BookIcon size={16} /> <span>{book.type} Book</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">{book.title}</h1>
          <div className="flex gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1 font-mono"><Users size={14} /> {book.audience}</span>
            <span className="flex items-center gap-1 font-mono"><FileText size={14} /> {book.pageCount} Chapters</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            disabled={exporting}
            onClick={handleExportPDF}
            className="px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
            Export KDP PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Cover Display (Premium) */}
        {book.coverUrl && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-8 rounded-[2.5rem] bg-indigo-900/10 border border-indigo-500/20 backdrop-blur-3xl flex flex-col md:flex-row gap-8 items-center"
          >
            <div className="w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 group relative">
              <img src={book.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Book Cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
            <div>
              <div className="px-3 py-1 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-indigo-500/30 inline-block mb-4">
                Premium AI Book Cover
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Professional Cover Art</h2>
              <p className="text-gray-400 text-sm mb-6 max-w-xl leading-relaxed italic">
                "{book.coverPrompt}"
              </p>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Dimensions</span>
                  <span className="text-white font-mono text-sm">{book.type === "Story" ? "6x9 in" : "8.5x11 in"}</span>
                </div>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Resolution</span>
                  <span className="text-white font-mono text-sm">300 DPI (High)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Manuscript Side */}
        <motion.div 
          key={currentPage}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-10 rounded-3xl backdrop-blur-2xl bg-white/5 border border-white/10 min-h-[600px] relative flex flex-col shadow-inner"
        >
          <div className="absolute top-6 left-6 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-3 py-1 rounded-full">
            {currentManuscriptPage.title || `Chapter ${currentManuscriptPage.pageNumber}`}
          </div>
          
          <div className="mt-12 prose prose-invert max-w-none text-white font-serif tracking-wide">
            <h2 className="text-2xl font-bold mb-6 text-indigo-100">{currentManuscriptPage.title}</h2>
            <div className="text-xl leading-relaxed whitespace-pre-wrap">
              {currentManuscriptPage.content}
            </div>
          </div>

          <div className="mt-auto pt-10 flex items-center justify-between border-t border-white/5">
            <button 
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0 transition-all text-white border border-white/10"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-gray-500 text-xs font-mono font-bold tracking-widest">{currentPage + 1} / {book.manuscript.length}</span>
            <button 
              disabled={currentPage === book.manuscript.length - 1}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0 transition-all text-white border border-white/10"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </motion.div>

        {/* Prompt Side */}
        <div className="space-y-6">
          {currentManuscriptPage.imageUrl ? (
            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
              <img 
                src={currentManuscriptPage.imageUrl} 
                alt="AI Generated Illustration" 
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-gray-300 italic line-clamp-2">"{currentManuscriptPage.imagePrompt}"</p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl backdrop-blur-2xl border transition-all relative overflow-hidden group bg-amber-900/10 border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-4 uppercase text-[10px] tracking-widest">
                <ImageIcon size={16} /> Illustration Prompt
              </div>
              <p className="text-gray-300 italic mb-6 leading-relaxed text-sm font-mono p-4 bg-black/20 rounded-xl">
                "{currentManuscriptPage.imagePrompt}"
              </p>
            </div>
          )}

          <div className="p-8 rounded-3xl backdrop-blur-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <h3 className="text-white font-bold mb-4 flex items-center justify-between text-sm uppercase tracking-wider">
              Visual Consistency Tip
              <Sparkles size={16} className="text-amber-400" />
            </h3>
            <p className="text-xs text-gray-500 leading-loose">
              To keep your character identical across chapters, use the 'Seed' feature in Leonardo AI and keep the same 'Character Reference' image.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
