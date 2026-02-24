import React, { useState } from 'react';
import { Camera, AlertTriangle, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { analyzeDamage } from '../services/geminiService';
import { cn } from '../types';

interface ReportDamageProps {
  location: [number, number];
  onReportSuccess: () => void;
}

export const ReportDamage: React.FC<ReportDamageProps> = ({ location, onReportSuccess }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImage(base64);
        setIsAnalyzing(true);
        try {
          const result = await analyzeDamage(base64);
          setAnalysis(result);
        } catch (error) {
          console.error("Analysis failed", error);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!analysis || !image) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: analysis.damageType,
          severity: analysis.severity,
          description: analysis.description,
          latitude: location[0],
          longitude: location[1],
          image_url: image
        })
      });
      setIsSuccess(true);
      setTimeout(() => {
        onReportSuccess();
        setIsSuccess(false);
        setImage(null);
        setAnalysis(null);
      }, 2000);
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900">Report Damage</h2>
          <p className="text-sm text-zinc-500">AI-powered damage assessment</p>
        </div>
      </div>

      {!image ? (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-200 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Camera className="w-10 h-10 text-zinc-400 mb-3" />
            <p className="text-sm text-zinc-600">Click to capture or upload photo</p>
            <p className="text-xs text-zinc-400 mt-1">Geo-tagging will be automatic</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-100">
            <img src={image} alt="Damage" className="w-full h-full object-cover" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm font-medium">AI Analyzing Damage...</p>
              </div>
            )}
          </div>

          {analysis && !isSuccess && (
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    analysis.severity === 'Critical' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {analysis.severity} Severity
                  </span>
                  <h3 className="font-bold text-zinc-900 mt-1">{analysis.damageType}</h3>
                </div>
                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                  <MapPin size={12} />
                  <span>{location[0].toFixed(4)}, {location[1].toFixed(4)}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{analysis.description}</p>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Recommended Actions</p>
                <ul className="text-xs text-zinc-600 space-y-1">
                  {analysis.safetyActions.map((action: string, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-500">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Official Report"}
              </button>
            </div>
          )}

          {isSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-xl flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
              <h3 className="font-bold text-emerald-900">Report Submitted</h3>
              <p className="text-sm text-emerald-700 mt-1">Authorities have been notified of your location and the damage severity.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
