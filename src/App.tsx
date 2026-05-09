import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./lib/firebase";

import Navbar from "./components/Navbar";
import SkyBackground from "./components/SkyBackground";
import Landing from "./pages/Landing";
import Generator from "./pages/Generator";
import Dashboard from "./pages/Dashboard";
import BookViewer from "./pages/BookViewer";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  
  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen text-slate-200 font-sans selection:bg-indigo-500/30">
        <SkyBackground />
        <Navbar />
        
        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route 
              path="/generator" 
              element={
                <ProtectedRoute>
                  <Generator />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/book/:id" 
              element={
                <ProtectedRoute>
                  <BookViewer />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="py-10 text-center text-gray-600 text-sm border-t border-white/5 mx-6">
          <p>© {new Date().getFullYear()} Aala AI. All rights reserved. Built for creators.</p>
        </footer>
      </div>
    </Router>
  );
}
