import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Book as BookIcon, Download, ExternalLink, Plus, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBooks() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "books"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const bookData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBooks(bookData);
      } catch (error) {
        console.error("Fetch books error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [user]);

  if (loading) return <div className="pt-40 text-center text-white">Loading your library...</div>;

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My Library</h1>
          <p className="text-gray-400">Manage and download your AI-generated books.</p>
        </div>
        <button 
          onClick={() => navigate("/generator")}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Create New Book
        </button>
      </div>

      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
          <BookIcon size={48} className="text-gray-600 mb-4" />
          <p className="text-gray-300 text-lg font-medium">No books yet</p>
          <p className="text-gray-500 mb-8">Your journey to Amazon KDP success starts here.</p>
          <Link to="/generator" className="text-indigo-400 font-bold hover:underline">Create your first book now →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <motion.div
              layoutId={book.id}
              key={book.id}
              className="rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all group overflow-hidden"
            >
              <div className="aspect-[3/4] bg-indigo-500/10 relative overflow-hidden">
                {book.coverUrl ? (
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookIcon size={48} className="text-indigo-400/20" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[9px] font-bold text-white border border-white/20 uppercase tracking-widest">
                    {book.type}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{book.title}</h3>
                <p className="text-gray-400 text-xs mb-6 line-clamp-1">{book.theme}</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                  >
                    View Manuscript <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
