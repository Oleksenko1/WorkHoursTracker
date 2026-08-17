import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, RefreshCw, Lightbulb } from 'lucide-react';
import { getRandomLuckyQuestion } from '../firebase/dbService';

export const LuckyBlockModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const q = await getRandomLuckyQuestion();
      setQuestion(q);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchQuestion();
  };

  return (
    <>
      {/* Top Right Question? Button */}
      <button
        onClick={handleOpen}
        className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all border border-amber-500/30 text-amber-300 active:scale-95 shadow-md glow-gold"
        title="Random question from database"
      >
        <HelpCircle className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold">Question?</span>
      </button>

      {/* Question Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden"
            >
              {/* Top ambient highlight */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Question?</h3>
                  <p className="text-[11px] text-amber-400 font-medium">Random thought from Firestore</p>
                </div>
              </div>

              {/* Question Box */}
              <div className="my-6 p-5 bg-slate-950/80 border border-slate-800 rounded-2xl min-h-[110px] flex items-center justify-center relative">
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching question from database...</span>
                  </div>
                ) : (
                  <motion.p
                    key={question?.id || 'text'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm sm:text-base font-medium text-slate-100 text-center leading-relaxed italic"
                  >
                    "{question?.text || 'What is one thing you are grateful for today?'}"
                  </motion.p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={fetchQuestion}
                  disabled={loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg glow-gold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Next Question</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
