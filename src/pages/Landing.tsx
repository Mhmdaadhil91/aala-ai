import { motion } from "motion/react";
import { ArrowRight, Sparkles, BookCheck, Download, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center pt-32 pb-20 px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm mb-6">
          <Sparkles size={16} />
          <span>The #1 AI Book Architect for Amazon KDP</span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-8 leading-tight">
          Publish Your Next <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Best Seller</span> in Minutes.
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          From children's stories to coloring books. Aala AI generates full manuscripts, 
          stunning image prompts, and KDP-ready PDFs automatically.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => navigate("/generator")}
            className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.4)] hover:-translate-y-1"
          >
            Start Creating <ArrowRight size={20} />
          </button>
          <button className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-lg border border-white/10 transition-all hover:-translate-y-1">
            View Example Books
          </button>
        </div>
      </motion.div>

      {/* Stats/Social Proof */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl"
      >
        <FeatureCard 
          icon={<BookCheck className="text-indigo-400" />}
          title="Full Manuscript"
          desc="AI writes your story, page by page, optimized for your target audience."
        />
        <FeatureCard 
          icon={<Palette className="text-purple-400" />}
          title="AI Illustrations"
          desc="Get cinematic image prompts that maintain character consistency across pages."
        />
        <FeatureCard 
          icon={<Download className="text-pink-400" />}
          title="KDP-Ready PDF"
          desc="Download perfectly formatted PDFs with correct bleed and margins."
        />
      </motion.div>

      {/* Book Type Showcase */}
      <div className="mt-40 w-full max-w-7xl">
        <h2 className="text-4xl font-bold text-white text-center mb-16">What will you build?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <BookType 
            img="https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=800"
            title="Motivation"
            tag="INTERNAL FORCE"
          />
          <BookType 
            img="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
            title="Success"
            tag="GROWTH"
          />
          <BookType 
            img="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800"
            title="Money & Finance"
            tag="WEALTH"
          />
          <BookType 
            img="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
            title="Children Stories"
            tag="CREATIVITY"
          />
          <BookType 
            img="https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800"
            title="Coloring Books"
            tag="KIDS FUN"
          />
          <BookType 
            img="https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=800"
            title="Islamic Lifestyle"
            tag="FAITH"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all hover:bg-white/10 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function BookType({ img, title, tag }: { img: string, title: string, tag: string }) {
  return (
    <div className="relative group cursor-pointer overflow-hidden rounded-3xl h-[400px]">
      <img 
        src={img} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent group-hover:from-indigo-900/80 transition-colors"></div>
      <div className="absolute bottom-6 left-6 right-6">
        <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-2 block">{tag}</span>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
    </div>
  );
}
