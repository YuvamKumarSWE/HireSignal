import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.evaluation) {
    return (
      <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex flex-col relative overflow-hidden">
        <nav className="p-8 flex justify-between items-center z-10">
          <div
            onClick={() => navigate("/")}
            className="text-xl font-bold tracking-tighter font-sans uppercase cursor-pointer hover:opacity-60 transition-opacity"
          >
            HireSignal
          </div>
        </nav>
        <main className="flex-1 flex flex-col items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl font-serif mb-4">No Results Found</h1>
            <p className="font-sans text-lg opacity-60 mb-8">Complete an interview to see your evaluation.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 bg-[#1A1A1A] text-[#EAE7DE] text-lg font-sans font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              Back to Dashboard
            </button>
          </motion.div>
        </main>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
      </div>
    );
  }

  const { hire_probability, strengths, weaknesses, final_verdict } = state.evaluation;
  const pct = Math.round(hire_probability * 100);
  const scoreColor = pct >= 70 ? "text-green-700" : pct >= 45 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-[#EAE7DE] text-[#1A1A1A] flex flex-col relative overflow-hidden">
      <nav className="p-8 flex justify-between items-center z-10">
        <div
          onClick={() => navigate("/")}
          className="text-xl font-bold tracking-tighter font-sans uppercase cursor-pointer hover:opacity-60 transition-opacity"
        >
          HireSignal
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full text-center mb-10"
        >
          <h1 className="text-6xl md:text-7xl font-serif mb-4">The Verdict.</h1>
          <p className="font-sans text-lg opacity-60 uppercase tracking-widest">Your interview evaluation</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="w-full space-y-6"
        >
          {/* Score card */}
          <div className="bg-[#F4F1E8] rounded-2xl border border-[#D1D1D1] p-8 text-center shadow-sm">
            <p className="font-sans text-sm uppercase tracking-widest opacity-60 mb-2">Hire Probability</p>
            <p className={`text-7xl font-serif font-bold ${scoreColor}`}>{pct}%</p>
          </div>

          {/* Strengths */}
          <div className="bg-[#F4F1E8] rounded-2xl border border-[#D1D1D1] p-8 shadow-sm">
            <h2 className="font-sans text-sm uppercase tracking-widest opacity-60 mb-4">Strengths</h2>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-base font-sans">
                  <span className="mt-0.5 text-green-700 font-bold text-lg leading-none">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-[#F4F1E8] rounded-2xl border border-[#D1D1D1] p-8 shadow-sm">
            <h2 className="font-sans text-sm uppercase tracking-widest opacity-60 mb-4">Areas to Improve</h2>
            <ul className="space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-3 text-base font-sans">
                  <span className="mt-0.5 text-red-600 font-bold text-lg leading-none">−</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Final verdict */}
          <div className="bg-[#F4F1E8] rounded-2xl border border-[#D1D1D1] p-8 shadow-sm">
            <h2 className="font-sans text-sm uppercase tracking-widest opacity-60 mb-4">Final Verdict</h2>
            <p className="text-base font-sans">{final_verdict}</p>
          </div>

          {/* Actions */}
          <motion.div
            className="flex justify-center gap-4 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 border-2 border-[#1A1A1A] text-[#1A1A1A] text-lg font-sans font-bold rounded-full hover:bg-[#1A1A1A] hover:text-[#EAE7DE] transition-all"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-10 py-4 bg-[#1A1A1A] text-[#EAE7DE] text-lg font-sans font-bold rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              New Interview
            </button>
          </motion.div>
        </motion.div>
      </main>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vh] h-[120vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] border border-[#1A1A1A] opacity-[0.03] rounded-full pointer-events-none"></div>
    </div>
  );
}
