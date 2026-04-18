"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, Sparkles, Cpu, Zap, Activity } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Prediction {
  label: string;
  confidence: number;
}

interface AnalysisResult {
  top1: string;
  confidence: number;
  predictions: Prediction[];
}

export default function ClassificationApp() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setStatus("idle");
      setResult(null);
      setError(null);
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setStatus("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData);
      setTaskId(response.data.task_id);
      setStatus("processing");
    } catch (err) {
      setStatus("error");
      setError("Failed to upload image. Please check API connection.");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (status === "processing" && taskId) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/status/${taskId}`);
          if (response.data.status === "SUCCESS") {
            setResult(response.data.result);
            setStatus("success");
            clearInterval(interval);
          } else if (response.data.status === "FAILURE") {
            setStatus("error");
            setError("Processing failed on worker.");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [status, taskId]);

  return (
    <div className="min-h-screen bg-base-300 text-base-content selection:bg-primary/30 font-sans p-4 md:p-8">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="badge badge-primary badge-outline gap-2 p-4 mb-6 animate-pulse">
            <Sparkles size={16} />
            <span className="font-bold tracking-widest uppercase text-xs">YOLO Vision Engine v2.0</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
            AI CLASSIFIER
          </h1>
          <p className="text-base-content/60 text-lg md:text-2xl max-w-3xl mx-auto font-light">
            Professional-grade distributed image analysis using YOLO26n and ONNX Runtime.
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="stats shadow-2xl bg-base-200/50 backdrop-blur-xl border border-white/5 mb-12 w-full max-w-4xl"
        >
          <div className="stat">
            <div className="stat-figure text-primary">
              <Cpu size={28} />
            </div>
            <div className="stat-title">Engine</div>
            <div className="stat-value text-primary text-2xl uppercase">ONNX</div>
            <div className="stat-desc">v1.24.4 Runtime</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-secondary">
              <Activity size={28} />
            </div>
            <div className="stat-title">Backend</div>
            <div className="stat-value text-secondary text-2xl uppercase">Celery</div>
            <div className="stat-desc">Distributed Worker</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-accent">
              <Zap size={28} />
            </div>
            <div className="stat-title">Latency</div>
            <div className="stat-value text-accent text-2xl">~200ms</div>
            <div className="stat-desc">Ultra-fast inference</div>
          </div>
        </motion.div>

        {/* Main Interface Layout */}
        <div className="grid lg:grid-cols-12 gap-8 w-full">
          
          {/* Left Column: Upload */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-12 xl:col-span-7 space-y-6"
          >
            <div className="card bg-base-200/50 backdrop-blur-3xl border border-white/5 overflow-hidden group relative">
              <div className="card-body p-0">
                <label className="cursor-pointer group">
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  <div className={`aspect-[16/10] flex flex-col items-center justify-center transition-all duration-500 relative
                    ${preview ? 'p-2' : 'p-12 hover:bg-white/5'}`}>
                    
                    {!preview ? (
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                          <Upload className="text-base-content/50 group-hover:text-primary" size={40} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">Upload Source Image</p>
                          <p className="text-base-content/40">Drag and drop or click to browse</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-6 left-6 flex items-center gap-3">
                          <div className="badge badge-lg badge-primary font-bold shadow-lg">SOURCE VIEW</div>
                          <span className="text-white/80 text-sm italic">{file?.name}</span>
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {status !== "idle" && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-black/80 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-6"
                        >
                          <span className="loading loading-spinner text-primary loading-xl"></span>
                          <div className="text-center">
                            <h3 className="text-2xl font-black uppercase tracking-widest mb-2">{status}</h3>
                            <div className="flex gap-1 justify-center">
                              <span className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-[0_0_10px_#570df8]" />
                              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_#570df8]" />
                              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_#570df8]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-base-100/30 border-t border-white/5 flex gap-4">
                <button 
                  onClick={startAnalysis}
                  disabled={!file || status !== "idle"}
                  className={`btn btn-lg flex-1 shadow-xl transition-all font-black text-lg
                    ${!file || status !== "idle" ? 'btn-disabled' : 'btn-primary hover:scale-[1.02]'}`}
                >
                  <Zap size={20} />
                  EXECUTE INFERENCE
                </button>
                <button 
                  onClick={() => { setFile(null); setPreview(null); setStatus("idle"); setResult(null); }}
                  className="btn btn-lg btn-square btn-ghost hover:bg-error/30 hover:text-error"
                >
                  <AlertCircle size={24} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Analysis */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-12 xl:col-span-5 h-full"
          >
            <div className="card bg-base-200/50 backdrop-blur-3xl border border-white/5 h-full">
              <div className="card-body p-8">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="card-title text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_#570df8]" />
                    Insight Analysis
                  </h2>
                  <div className="badge badge-outline text-xs opacity-50 px-3">CELERY-WORKER-01</div>
                </div>

                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {status === "idle" && !result && (
                      <motion.div 
                        key="idle-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center opacity-30 py-16"
                      >
                        <ImageIcon size={100} strokeWidth={0.5} className="mb-6" />
                        <p className="text-xl font-bold uppercase tracking-widest italic">Awaiting Payload</p>
                        <p className="text-sm">Inference results will appear here</p>
                      </motion.div>
                    )}

                    {status === "error" && (
                      <motion.div 
                        key="error-view"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="alert alert-error bg-error/20 border-error/20 flex-col items-center p-12 text-center"
                      >
                        <AlertCircle size={64} className="mb-4" />
                        <h3 className="text-xl font-black mb-2">CRITICAL FAILURE</h3>
                        <p className="text-sm opacity-80 mb-6">{error || "The inference pipeline was interrupted."}</p>
                        <button onClick={() => setStatus("idle")} className="btn btn-sm btn-outline">REBOOT PIPELINE</button>
                      </motion.div>
                    )}

                    {result && (
                      <motion.div 
                        key="result-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                      >
                        {/* Top Result Card */}
                        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 transform transition hover:scale-[1.02]">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-xs font-black tracking-widest uppercase text-primary opacity-80">Primary Match</span>
                            <div className="badge badge-primary font-bold shadow-[0_0_20px_#570df8]">TOP-1</div>
                          </div>
                          <div className="flex justify-between items-end">
                            <h3 className="text-4xl md:text-5xl font-black capitalize text-base-content tracking-tighter">
                              {result.top1.replace(/_/g, ' ')}
                            </h3>
                            <p className="text-4xl font-black text-primary">
                              {(result.confidence * 100).toFixed(1)}<span className="text-sm opacity-50">%</span>
                            </p>
                          </div>
                          <progress className="progress progress-primary w-full h-3 mt-8 shadow-inner" value={result.confidence * 100} max="100"></progress>
                        </div>

                        {/* List results */}
                        <div className="space-y-6">
                          <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-2">
                             Distribution Probabilities
                            <span className="h-[1px] flex-1 bg-white/5" />
                          </h4>
                          
                          {result.predictions.slice(1, 6).map((pred, i) => (
                            <div key={i} className="group">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold uppercase tracking-tight text-base-content/70 group-hover:text-base-content transition-colors capitalize">
                                  {pred.label.replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono text-sm font-bold text-secondary">
                                  {(pred.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="relative h-2 bg-base-300 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pred.confidence * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="absolute inset-y-0 bg-secondary rounded-full shadow-[0_0_10px_#d926aa]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Footer Result Info */}
                        <div className="pt-8 border-t border-white/5 flex items-center justify-between text-xs font-bold opacity-30 uppercase tracking-widest">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-success" />
                            Validated Output
                          </div>
                          <span>Checksum: 0x{taskId?.slice(0, 8)}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Global Footer info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-24 py-8 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-8 opacity-40 text-[10px] font-black uppercase tracking-[0.3em]"
        >
          <div className="flex gap-12">
            <div>
              <p className="mb-2">Architecture</p>
              <p className="text-white">Distributed Node</p>
            </div>
            <div>
              <p className="mb-2">Protocol</p>
              <p className="text-white">Celery / AMQP</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            System Status: 100% Operational
          </div>
          <div className="flex gap-4">
            <p>© 2026 AI VISION LABS</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
