/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { Hammer, Info, RotateCcw, ChevronDown, AlertTriangle, Calculator, Check, Trash2, Plus, Clock, History, ClipboardList, User, Calendar, CheckCircle2, LayoutDashboard, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---

interface CutDetail {
  id: string;
  piece: string;
  qty: number;
  size: number;
  formula: string;
  dimensions?: string;
}

interface WindowProject {
  id: string;
  name: string;
  clientName: string;
  type: 'P65' | 'P92' | 'P40' | 'VENTILADA';
  width: number; // sixteenths
  height: number; // sixteenths
  vias: 2 | 3 | 4;
  results: {
    marco: CutDetail[];
    hojas: CutDetail[];
    vidrios: CutDetail[];
  };
  completedCuts: string[]; // List of CutDetail IDs that are finished
  status: 'pending' | 'completed';
  createdAt: number;
  deliveryDate?: string;
}

// --- Utilities ---

const FRACTIONS = [
  { label: "0", value: 0 },
  { label: "1/16", value: 1 },
  { label: "1/8", value: 2 },
  { label: "3/16", value: 3 },
  { label: "1/4", value: 4 },
  { label: "5/16", value: 5 },
  { label: "3/8", value: 6 },
  { label: "7/16", value: 7 },
  { label: "1/2", value: 8 },
  { label: "9/16", value: 9 },
  { label: "5/8", value: 10 },
  { label: "11/16", value: 11 },
  { label: "3/4", value: 12 },
  { label: "13/16", value: 13 },
  { label: "7/8", value: 14 },
  { label: "15/16", value: 15 },
];

function formatFraction(sixteenths: number): string {
  const whole = Math.floor(sixteenths / 16);
  const rem = Math.round(sixteenths % 16);
  if (rem === 0) return `${whole}"`;
  let n = rem;
  let d = 16;
  while (n % 2 === 0 && d % 2 === 0) {
    n /= 2;
    d /= 2;
  }
  return whole === 0 ? `${n}/${d}"` : `${whole} ${n}/${d}"`;
}

// --- Components ---

const CLIENT_COLORS = [
  { bg: 'bg-blue-500/5', border: 'border-blue-500/20', accent: 'text-blue-400', bar: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/20', accent: 'text-emerald-400', bar: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
  { bg: 'bg-violet-500/5', border: 'border-violet-500/20', accent: 'text-violet-400', bar: 'bg-violet-500', shadow: 'shadow-violet-500/20' },
  { bg: 'bg-amber-500/5', border: 'border-amber-500/20', accent: 'text-amber-400', bar: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
  { bg: 'bg-rose-500/5', border: 'border-rose-500/20', accent: 'text-rose-400', bar: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
  { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', accent: 'text-cyan-400', bar: 'bg-cyan-500', shadow: 'shadow-cyan-500/20' },
];

function ClientDashboard({ projects, onClientClick, selectedClientName, title, subtitle }: { 
  projects: WindowProject[], 
  onClientClick?: (clientName: string) => void,
  selectedClientName?: string | null,
  title?: string,
  subtitle?: string
}) {
  const statsByClient = useMemo(() => {
    const groups: Record<string, { 
      count: number; 
      done: number; 
      entryDate: number; 
      exitDate?: string;
      pendingCuts: number;
    }> = {};

    projects.forEach(p => {
      if (!groups[p.clientName]) {
        groups[p.clientName] = { 
          count: 0, 
          done: 0, 
          entryDate: p.createdAt, 
          exitDate: p.deliveryDate,
          pendingCuts: 0
        };
      }
      groups[p.clientName].count++;
      if (p.status === 'completed') groups[p.clientName].done++;
      
      const totalCuts = p.results.marco.length + p.results.hojas.length + p.results.vidrios.length;
      groups[p.clientName].pendingCuts += (totalCuts - p.completedCuts.length);
      
      if (p.createdAt < groups[p.clientName].entryDate) {
        groups[p.clientName].entryDate = p.createdAt;
      }
      // Use the latest delivery date found as the finish target
      if (p.deliveryDate && (!groups[p.clientName].exitDate || new Date(p.deliveryDate) > new Date(groups[p.clientName].exitDate))) {
        groups[p.clientName].exitDate = p.deliveryDate;
      }
    });

    return Object.entries(groups).sort((a, b) => {
      const progA = a[1].done / a[1].count;
      const progB = b[1].done / b[1].count;
      
      // If one is 100% and other is not, put 100% at the bottom
      if (progA === 1 && progB < 1) return 1;
      if (progB === 1 && progA < 1) return -1;
      
      // Otherwise sort by date
      return b[1].entryDate - a[1].entryDate;
    });
  }, [projects]);

  if (projects.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
          {title || "Panel de Control"}
        </h2>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-brand-accent rounded-full" />
          <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">
            {subtitle || "Ordenes de Trabajo Activas"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsByClient.map(([name, data]) => {
          const progress = Math.round((data.done / data.count) * 100);
          const isComplete = progress === 100;
          const isSelected = selectedClientName === name;

          // Deterministic color based on name
          const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % CLIENT_COLORS.length;
          const clientColor = CLIENT_COLORS[colorIndex];

          return (
            <motion.div 
              layout
              key={name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onClientClick?.(name)}
              className={`p-5 rounded-[2rem] relative overflow-hidden group transition-all cursor-pointer shadow-xl border-2 ${
                isSelected 
                  ? 'bg-brand-sidebar border-brand-accent ring-4 ring-brand-accent/20 scale-[1.02]' 
                  : isComplete 
                    ? 'bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : `${clientColor.bg} ${clientColor.border} hover:border-white/20 transition-all hover:scale-[1.01]`
              }`}
            >
              <div className="absolute top-0 right-0 p-5 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                <User size={100} className={isComplete ? 'text-emerald-500' : clientColor.accent} />
              </div>

              <div className="relative z-10 space-y-5">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-[8px] font-black uppercase tracking-widest opacity-70 ${isComplete ? 'text-emerald-400' : clientColor.accent}`}>Cliente</p>
                    {isComplete && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse">Completado</span>
                    )}
                  </div>
                  <h3 className={`text-xl font-black italic truncate pr-4 ${isComplete ? 'text-emerald-100' : 'text-white'}`}>{name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] text-brand-muted uppercase font-black tracking-tighter opacity-50 flex items-center gap-1">
                      <Clock size={8} /> Empiezo
                    </p>
                    <p className="text-[10px] font-mono font-bold text-white/80">
                      {new Date(data.entryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-brand-muted uppercase font-black tracking-tighter opacity-50 flex items-center gap-1">
                      <RotateCcw size={8} className={isComplete ? 'text-emerald-400' : clientColor.accent} /> Termina
                    </p>
                    <p className={`text-[10px] font-mono font-bold ${isComplete ? 'text-emerald-400' : clientColor.accent}`}>
                      {data.exitDate ? new Date(data.exitDate).toLocaleDateString() : 'Pendiente'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[8px] text-brand-muted uppercase font-black tracking-widest opacity-50">Detalles de Orden</p>
                   <div className="flex justify-between items-center mb-1 px-0.5">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isComplete ? 'text-emerald-400' : clientColor.accent}`}>{data.count} Ventanas</p>
                      <p className={`text-xs font-black italic tabular-nums ${isComplete ? 'text-emerald-100' : 'text-white'}`}>{progress}%</p>
                   </div>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${isComplete ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : `${clientColor.bar} shadow-[0_0_10px_${clientColor.bar === 'bg-blue-500' ? 'rgba(59,130,246,0.5)' : 'rgba(0,0,0,0.5)'}]`}`}
                        style={{ backgroundColor: isComplete ? undefined : clientColor.bar.replace('bg-', '') }}
                      />
                   </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function ResultsBreakdown({ 
  results, 
  completedCuts = [], 
  onToggleCut 
}: { 
  results: WindowProject['results'];
  completedCuts?: string[];
  onToggleCut?: (cutId: string) => void;
}) {
  const sortItems = (items: CutDetail[]) => {
    return [...items].sort((a, b) => {
      const aDone = completedCuts.includes(a.id);
      const bDone = completedCuts.includes(b.id);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: "M. Marco", items: results.marco, color: "blue" },
        { title: "M. Hojas", items: results.hojas, color: "purple" },
        { title: "M. Cristal", items: results.vidrios, color: "emerald" }
      ].map((cat) => (
        <div key={cat.title} className="bg-brand-sidebar/40 border border-brand-border p-4 rounded-[1.5rem] relative overflow-hidden">
          <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-muted mb-4 px-1">{cat.title}</h5>
          <div className="space-y-3">
             {sortItems(cat.items).map(item => {
               const isDone = completedCuts.includes(item.id);
               return (
                 <motion.div 
                   layout
                   key={item.id} 
                   onClick={() => onToggleCut?.(item.id)}
                   className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer group ${
                     isDone 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/5 border-transparent hover:border-brand-accent/30'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                        isDone 
                          ? 'bg-red-500 border-red-500' 
                          : 'border-brand-border bg-brand-bg/50'
                      }`}>
                        {isDone && <Check size={10} strokeWidth={4} className="text-white" />}
                      </div>
                      
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-tight leading-tight ${isDone ? 'text-red-400' : 'text-white'}`}>
                          {item.piece}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                           <p className={`text-base font-black italic tabular-nums ${isDone ? 'text-red-300' : 'text-brand-accent'}`}>
                             {item.qty}
                           </p>
                           <p className={`text-[8px] font-black uppercase tracking-widest opacity-30 ${isDone ? 'text-red-300' : 'text-brand-muted'}`}>
                             Piezas
                           </p>
                        </div>
                        {item.formula && (
                          <p className={`text-[7px] font-black uppercase tracking-widest leading-none mt-1 opacity-20 ${isDone ? 'text-red-400/50' : 'text-brand-accent/50'}`}>
                            {item.formula}
                          </p>
                        )}
                      </div>
                   </div>
                   <p className={`text-base font-mono font-black italic tabular-nums ${isDone ? 'text-red-500' : 'text-brand-accent'}`}>
                      {item.dimensions || formatFraction(item.size)}
                   </p>
                 </motion.div>
               );
             })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WindowPreview({ width, height, vias = 2, large = false, windowType = 'P65' }: { width: number; height: number; vias?: number; large?: boolean; windowType?: string }) {
  const ratio = width / height;
  const maxWidth = large ? 200 : 140; 
  const maxHeight = large ? 120 : 110; 
  
  let w = maxWidth;
  let h = maxWidth / ratio;
  
  if (h > maxHeight) {
    h = maxHeight;
    w = maxHeight * ratio;
  }

  return (
    <div className={`flex items-center justify-center bg-black/40 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-2xl ${large ? 'h-48 w-full p-6' : 'h-32 w-full p-4'}`}>
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
      
      <div 
        className="border-[3px] border-brand-accent/50 rounded-md relative flex bg-brand-accent/5 overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02]"
        style={{ width: w, height: h }}
      >
        {/* Outer Frame Bevel */}
        <div className="absolute inset-0 border border-white/5 pointer-events-none z-20" />

        {Array.from({ length: vias }).map((_, i) => {
          const widthPct = 100 / vias;
          const overlapWidth = widthPct * 1.12;
          const isSelected = i % 2 !== 0; 
          
          return (
            <div 
              key={i}
              className={`absolute top-0.5 bottom-0.5 border-2 transition-all duration-700 flex items-center justify-center ${
                isSelected 
                  ? 'z-10 bg-brand-accent/30 border-brand-accent shadow-[0_0_25px_rgba(59,130,246,0.5)]' 
                  : 'z-0 bg-brand-accent/10 border-brand-accent/40'
              }`}
              style={{ 
                width: `${overlapWidth}%`, 
                left: `${(100 / vias) * i - (i > 0 ? 3 : 0)}%`,
                borderRadius: '1px'
              }}
            >
               {/* Glass Reflection Effect */}
               <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-40" />
               <div className="absolute top-0 left-0 w-full h-[1px] bg-white/30" />
               
               {/* Professional Handle simulation */}
               <div className={`w-[2.5px] h-1/4 rounded-full ${isSelected ? 'bg-white shadow-[0_0_5px_white]' : 'bg-brand-accent/30'} absolute ${i === 0 ? 'right-1' : 'left-1'}`} />
            </div>
          );
        })}
        
        {!large && (
          <>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-brand-accent tracking-tighter whitespace-nowrap bg-brand-bg/80 px-1 rounded">
               {formatFraction(width)}
            </div>
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] font-mono font-black text-brand-accent tracking-tighter whitespace-nowrap bg-brand-bg/80 px-1 rounded">
               {formatFraction(height)}
            </div>
          </>
        )}
      </div>
      
      {large && (
        <>
          <div className="absolute top-4 left-6 right-6 flex justify-between items-start pointer-events-none">
             <div className="space-y-0.5">
                <p className="text-[6px] font-black text-brand-muted uppercase tracking-[0.4em]">Configuración</p>
                <h4 className="text-[10px] font-black text-white italic tracking-tighter uppercase">{vias} Hojas / {windowType}</h4>
             </div>
          </div>
          <div className="absolute bottom-4 left-6 right-6 flex justify-center pointer-events-none">
             <p className="text-[10px] font-mono font-bold text-brand-accent italic tabular-nums bg-brand-bg/80 px-3 py-1 rounded-full border border-brand-accent/30 shadow-lg">
                {formatFraction(width)} X {formatFraction(height)}
             </p>
          </div>
        </>
      )}
    </div>
  );
}

interface InputFieldProps {
  label: string;
  whole: number;
  fraction: number;
  onWholeChange: (val: number) => void;
  onFractionChange: (val: number) => void;
}

function DimensionInput({ label, whole, fraction, onWholeChange, onFractionChange }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted ml-1">
        {label}
      </label>
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2 relative group">
          <input
            type="number"
            inputMode="numeric"
            value={whole === 0 ? '' : whole}
            onChange={(e) => onWholeChange(Math.max(0, parseInt(e.target.value) || 0))}
            placeholder="0"
            className="w-full h-14 bg-brand-sidebar border border-brand-border px-4 rounded-xl text-white font-mono text-xl focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all text-center placeholder:text-brand-muted/30"
          />
          <div className="absolute -top-2 left-3 px-1.5 bg-brand-sidebar text-[8px] font-black text-brand-accent border border-brand-border rounded">INT</div>
        </div>
        <div className="col-span-3 relative group">
          <select
            value={fraction}
            onChange={(e) => onFractionChange(parseInt(e.target.value))}
            className="w-full h-14 appearance-none bg-brand-sidebar border border-brand-border px-4 rounded-xl text-white font-mono text-base focus:outline-none focus:border-brand-accent transition-all cursor-pointer text-center"
          >
            {FRACTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-muted/50 group-hover:text-brand-accent transition-colors">
            <ChevronDown size={14} />
          </div>
          <div className="absolute -top-2 left-3 px-1.5 bg-brand-sidebar text-[8px] font-black text-brand-muted border border-brand-border rounded tracking-tighter">FRAC</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [windowTag, setWindowTag] = useState<string>("Ventana 01");
  const [clientName, setClientName] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [widthWhole, setWidthWhole] = useState<number>(60);
  const [widthFrac, setWidthFrac] = useState<number>(0);
  const [heightWhole, setHeightWhole] = useState<number>(48);
  const [heightFrac, setHeightFrac] = useState<number>(0);
  const [vias, setVias] = useState<2 | 3 | 4>(2);
  const [windowType, setWindowType] = useState<'P65' | 'P92' | 'P40' | 'VENTILADA'>('P65');
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [projects, setProjects] = useState<WindowProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<WindowProject | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string | null>(null);
  
  // Navigation & Order Creation State
  const [activeView, setActiveView] = useState<'dashboard' | 'history' | 'new-order'>('dashboard');
  const [orderStep, setOrderStep] = useState<1 | 2 | 3>(1);
  const [orderWindows, setOrderWindows] = useState<WindowProject[]>([]);

  // Security State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteClient, setPendingDeleteClient] = useState<string | null>(null);
  const [pendingChangeProfile, setPendingChangeProfile] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('v-cut-projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('v-cut-projects', JSON.stringify(projects));
  }, [projects]);

  const results = useMemo(() => {
    const totalWidth = widthWhole * 16 + widthFrac;
    const totalHeight = heightWhole * 16 + heightFrac;

    // European Profile Deductions (in 1/16ths)
    let leafVertDeduction = 28;    // 1 3/4" (Default P65)
    let leafOverlap = 18;          // 1 1/8" (Default P65)
    let glassDeduction = 52;       // 3 1/4" (Default P65)
    let frameHorizDeduction = 14;  // 7/8"
    
    let profileName = "P65";

    if (windowType === 'P92') {
      profileName = "P92";
      leafVertDeduction = 34;   // 2 1/8"
      leafOverlap = 25;         // 1 9/16"
      glassDeduction = 60;      // 3 3/4"
    } else if (windowType === 'P40') {
      profileName = "P40";
      leafVertDeduction = 26;   // 1 5/8"
      leafOverlap = 16;         // 1"
      glassDeduction = 44;      // 2 3/4"
    } else if (windowType === 'VENTILADA') {
      profileName = "VENT";
      leafVertDeduction = 28;
      leafOverlap = 16;
      glassDeduction = 48;
    }

    const sideRailsSize = totalHeight;
    const sillSize = totalWidth - frameHorizDeduction;
    const leafVerticalSize = totalHeight - leafVertDeduction;
    
    // Width Logic based on Vias
    // 2 vias: 1 overlap. 3 vias: 2 overlaps. 4 vias: 1 overlap (central meeting)
    const numOverlaps = (vias === 4) ? 1 : (vias - 1);
    const leafHorizontalSize = Math.floor((totalWidth + (numOverlaps * leafOverlap)) / vias);
    
    const glassWidth = leafHorizontalSize - glassDeduction;
    const glassHeight = leafVerticalSize - glassDeduction;

    return {
      inputs: { w: totalWidth, h: totalHeight, type: windowType, vias },
      marco: [
        { id: 'side', piece: "Rieles Laterales", qty: 2, size: sideRailsSize, formula: `Alto (${formatFraction(totalHeight)})` },
        { id: 'sill', piece: "Alféizar / Cabezal", qty: 2, size: sillSize, formula: `Ancho - ${formatFraction(frameHorizDeduction)}` },
      ],
      hojas: [
        { id: 'vert', piece: "Jamba / Llavín", qty: vias * 2, size: leafVerticalSize, formula: `Alto - ${formatFraction(leafVertDeduction)} (${profileName})` },
        { id: 'horiz', piece: "Zócalo / Cabezal", qty: vias * 2, size: leafHorizontalSize, formula: `(Ancho + ${numOverlaps > 0 ? formatFraction(numOverlaps * leafOverlap) : '0'}) / ${vias}` },
      ],
      vidrios: [
        { 
          id: 'glass', 
          piece: "Cristal", 
          qty: vias, 
          size: glassWidth, 
          dimensions: `${formatFraction(glassWidth)} X ${formatFraction(glassHeight)}`,
          formula: `H.Horiz x H.Vert (- ${formatFraction(glassDeduction)})` 
        }
      ]
    };
  }, [widthWhole, widthFrac, heightWhole, heightFrac, vias, windowType]);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
      setTimeout(() => {
        document.getElementById('desglose')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }, 600);
  };

  /* addToQueue was redundant, replaced by addToBatch flow */

  const toggleProjectStatus = (id: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, status: p.status === 'pending' ? 'completed' : 'pending' } : p
    ));
  };

  const toggleCutStatus = (projectId: string, cutId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const alreadyDone = p.completedCuts.includes(cutId);
      const newCompleted = alreadyDone 
        ? p.completedCuts.filter(id => id !== cutId)
        : [...p.completedCuts, cutId];
      
      const updated = { ...p, completedCuts: newCompleted };
      if (selectedProject?.id === projectId) {
        setSelectedProject(updated);
      }
      return updated;
    }));
  };

  const deleteProject = (id: string) => {
    setPendingDeleteId(id);
    setPendingDeleteClient(null);
    setPendingChangeProfile(false);
    setIsAuthModalOpen(true);
    setPassInput("");
  };

  const deleteClientGroup = (name: string) => {
    setPendingDeleteClient(name);
    setPendingDeleteId(null);
    setPendingChangeProfile(false);
    setIsAuthModalOpen(true);
    setPassInput("");
  };

  const requestProfileChange = () => {
    setPendingChangeProfile(true);
    setPendingDeleteId(null);
    setPendingDeleteClient(null);
    setIsAuthModalOpen(true);
    setPassInput("");
  };

  const confirmDeletion = () => {
    if (passInput === "1989") {
      if (pendingDeleteId) {
        setProjects(prev => prev.filter(p => p.id !== pendingDeleteId));
        if (selectedProject?.id === pendingDeleteId) {
          setSelectedProject(null);
        }
      } else if (pendingDeleteClient) {
        setProjects(prev => prev.filter(p => p.clientName !== pendingDeleteClient));
        if (selectedClientName === pendingDeleteClient) {
          setSelectedClientName(null);
        }
      } else if (pendingChangeProfile) {
        setOrderStep(2);
      }
      setIsAuthModalOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteClient(null);
      setPendingChangeProfile(false);
      setPassInput("");
    } else {
      setPassInput("");
    }
  };

  const handleReset = () => {
    setWidthWhole(60);
    setWidthFrac(0);
    setHeightWhole(48);
    setHeightFrac(0);
    setVias(2);
    setShowResults(false);
    setWindowTag("Ventana 01");
    setClientName("");
    setDeliveryDate("");
    setOrderWindows([]);
    setOrderStep(1);
    setActiveView('dashboard');
  };

  const startNewOrder = () => {
    setClientName("");
    setDeliveryDate("");
    setOrderWindows([]);
    setOrderStep(1);
    setActiveView('new-order');
    setWindowTag("Ventana 01");
  };

  const saveBatchOrder = () => {
    if (orderWindows.length === 0) return;
    setProjects(prev => [...orderWindows, ...prev]);
    setActiveView('dashboard');
    setOrderWindows([]);
  };

  const addToBatch = () => {
    const nextNum = orderWindows.length + 2;
    const nextTag = `Ventana ${nextNum.toString().padStart(2, '0')}`;
    
    const newWindow: WindowProject = {
      id: Math.random().toString(36).substr(2, 9),
      name: windowTag || `Ventana ${(orderWindows.length + 1).toString().padStart(2, '0')}`,
      clientName: clientName || "Cliente Genérico",
      type: windowType,
      width: widthWhole * 16 + widthFrac,
      height: heightWhole * 16 + heightFrac,
      vias,
      results,
      completedCuts: [],
      status: 'pending',
      createdAt: Date.now(),
      deliveryDate: deliveryDate
    };
    setOrderWindows(prev => [newWindow, ...prev]);
    setShowResults(false);
    setWindowTag(nextTag);
  };

  const pendingProjects = projects.filter(p => p.status === 'pending').sort((a,b) => {
    const aTotal = a.results.marco.length + a.results.hojas.length + a.results.vidrios.length;
    const aDone = a.completedCuts.length === aTotal;
    const bTotal = b.results.marco.length + b.results.hojas.length + b.results.vidrios.length;
    const bDone = b.completedCuts.length === bTotal;
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1;
  });
  const completedProjects = projects.filter(p => p.status === 'completed');

  const allByClient = useMemo(() => {
    const groups: Record<string, { pending: WindowProject[], completed: WindowProject[], stats: any }> = {};
    
    projects.forEach(p => {
      const client = p.clientName || "SIN NOMBRE";
      if (!groups[client]) {
        groups[client] = { pending: [], completed: [], stats: {} };
      }
      if (p.status === 'pending') groups[client].pending.push(p);
      else groups[client].completed.push(p);
    });

    return Object.entries(groups).map(([name, data]) => {
      const clientProjects = [...data.pending, ...data.completed];
      const entryDate = Math.min(...clientProjects.map(p => p.createdAt));
      const deliveryDates = clientProjects.map(p => p.deliveryDate).filter(Boolean) as string[];
      const exitDate = deliveryDates.length > 0 ? new Date(Math.max(...deliveryDates.map(d => new Date(d).getTime()))).toISOString() : null;
      
      const totalCuts = clientProjects.reduce((sum, p) => sum + p.results.marco.length + p.results.hojas.length + p.results.vidrios.length, 0);
      const doneCuts = clientProjects.reduce((sum, p) => sum + p.completedCuts.length, 0);
      const progress = totalCuts > 0 ? Math.round((doneCuts / totalCuts) * 100) : 0;

      return {
        name,
        pending: data.pending.sort((a,b) => a.createdAt - b.createdAt),
        completed: data.completed.sort((a,b) => b.createdAt - a.createdAt),
        entryDate,
        exitDate,
        progress,
        totalWindows: clientProjects.length,
        doneWindows: data.completed.length
      };
    }).sort((a, b) => a.entryDate - b.entryDate);
  }, [projects]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-white overflow-x-hidden uppercase-none">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900 rounded-full blur-[100px]" />
      </div>

      {/* Futuristic Scanline */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
         <div className="w-full h-[2px] bg-white animate-[scan_8s_linear_infinite]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-bg/80 border-b border-brand-border p-4 lg:px-10 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <motion.div 
            onClick={() => setActiveView('dashboard')}
            animate={{ 
              y: [0, -3, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            whileHover={{ scale: 1.1, rotate: 15 }}
            className="p-2.5 bg-gradient-to-br from-brand-accent via-blue-600 to-blue-800 rounded-2xl text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-white/10 cursor-pointer"
          >
            <Hammer size={22} strokeWidth={2.5} className="drop-shadow-lg" />
          </motion.div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tight text-white m-0 leading-none uppercase italic">HARMONY GLASS</h1>
            <p className="text-[10px] text-brand-muted font-mono tracking-[0.2em] font-medium mt-1 uppercase">Workshop OS</p>
          </div>
        </div>

        <button 
          onClick={handleReset} 
          className="p-3 bg-white/5 rounded-xl text-brand-muted hover:text-white transition-all ml-auto"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      <main className="relative flex-1 z-10">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 sm:space-y-16">
          
          {activeView === 'new-order' ? (
            <motion.div 
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 sm:space-y-12"
            >
              {/* Order Flow Header */}
              <div className="flex items-center justify-between px-1">
                 <button 
                   onClick={() => setActiveView('dashboard')}
                   className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] hover:text-white transition-all"
                 >
                    <ArrowLeft size={14} /> Volver
                 </button>
                 <div className="flex items-center gap-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${orderStep === step ? 'bg-brand-accent border-brand-accent text-white shadow-lg scale-105' : 'bg-white/5 border-white/10 text-brand-muted'}`}>
                          {step}
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

               {orderStep === 1 ? (<>
                <section className="bg-brand-sidebar border border-brand-border p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -mr-4 -mt-4">
                     <User size={80} />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">Nuevo Cliente</h2>
                    <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">Datos de la orden técnica</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">Cliente / Proyecto</label>
                      <input 
                        type="text" 
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Nombre o Ref. de obra"
                        className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg placeholder:text-brand-muted/10 focus:outline-none focus:border-brand-accent transition-all shadow-inner"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">Fecha Estimada</label>
                      <input 
                        type="date" 
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg focus:outline-none focus:border-brand-accent transition-all shadow-inner color-scheme-dark"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => clientName && setOrderStep(2)}
                    disabled={!clientName}
                    className="w-full h-12 sm:h-14 bg-red-600 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center gap-4 text-white font-black uppercase text-[10px] sm:text-xs shadow-xl disabled:opacity-20 disabled:grayscale transition-all"
                  >
                    Siguiente Paso <ArrowRight size={16} />
                  </motion.button>
                </section>

                {allByClient.length > 0 && (
                  <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] px-1 opacity-50">Clientes Existentes</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                      {allByClient.map(client => (
                        <div key={client.name} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-brand-accent/30 transition-all">
                          <div className="overflow-hidden">
                            <p className="text-sm font-black text-white italic truncate leading-none mb-1">{client.name}</p>
                            <p className="text-[9px] text-brand-muted uppercase font-mono">{client.totalWindows} Ventanas</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => deleteClientGroup(client.name)}
                               className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                             >
                               <Trash2 size={14} />
                             </button>
                             <button 
                               onClick={() => { setClientName(client.name); setOrderStep(2); }}
                               className="px-4 h-10 bg-red-600 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-red-500 transition-all"
                             >
                               Seleccionar
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </>
              ) : orderStep === 2 ? (
                <section className="bg-brand-sidebar border border-brand-border p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">Tipo de Ventana</h2>
                        <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">Seleccione el perfil de fabricación</p>
                     </div>
                     <button onClick={() => setOrderStep(1)} className="p-2 bg-white/5 rounded-lg text-brand-muted hover:text-white transition-all">
                        <ArrowLeft size={16} />
                     </button>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {([
                        { id: 'P65', desc: 'Series 65 Premium' },
                        { id: 'P92', desc: 'Industrial Heavy' },
                        { id: 'P40', desc: 'Residencial Slim' },
                        { id: 'VENTILADA', desc: 'Flujo de Aire' }
                      ] as const).map((type) => (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setWindowType(type.id);
                            setOrderStep(3);
                          }}
                          className={`p-6 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group ${windowType === type.id ? 'bg-brand-accent/10 border-brand-accent shadow-[0_0_25px_rgba(59,130,246,0.15)]' : 'bg-brand-bg border-brand-border hover:border-brand-accent/40'}`}
                        >
                           <div className="relative z-10">
                              <h3 className={`text-xl font-black italic mb-1 ${windowType === type.id ? 'text-brand-accent' : 'text-white'}`}>{type.id}</h3>
                              <p className="text-[9px] font-mono text-brand-muted uppercase tracking-tight">{type.desc}</p>
                           </div>
                           <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${windowType === type.id ? 'opacity-10 text-brand-accent' : 'text-white'}`}>
                              <Calculator size={100} />
                           </div>
                        </motion.button>
                      ))}
                   </div>

                   <div className="flex items-center gap-3 p-4 bg-brand-accent/5 border border-brand-accent/10 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent shrink-0">
                         <User size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest leading-tight">Configurando para:</p>
                        <p className="text-xs font-black text-white uppercase italic truncate">{clientName}</p>
                      </div>
                   </div>
                </section>
              ) : (<>
                  <div className="space-y-6">
                  {/* Step 3: Add Windows to this Client */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-[1.5rem] flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white shrink-0">
                             <User size={16} />
                          </div>
                          <div className="overflow-hidden">
                             <h4 className="text-sm font-black text-white uppercase italic truncate">{clientName}</h4>
                             <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest opacity-60">Cliente</p>
                          </div>
                       </div>
                       <button onClick={() => setOrderStep(1)} className="p-2 hover:bg-white/5 rounded-lg text-brand-muted transition-all"><ArrowLeft size={14} /></button>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 rounded-[1.5rem] flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-sidebar border border-white/5 flex items-center justify-center text-brand-accent shrink-0">
                             <Calculator size={16} />
                          </div>
                          <div className="overflow-hidden">
                             <h4 className="text-sm font-black text-white uppercase italic truncate">{windowType}</h4>
                             <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest opacity-60">Perfil Seleccionado</p>
                          </div>
                       </div>
                       <button onClick={requestProfileChange} className="p-2 hover:bg-white/5 rounded-lg text-brand-muted transition-all"><RotateCcw size={14} /></button>
                    </div>
                  </div>
</div>

                  {/* Calculator Console */}
                  <section className="bg-brand-sidebar border border-brand-border p-5 sm:p-2 rounded-[2rem] sm:rounded-[3rem] shadow-2xl space-y-6 sm:space-y-8 overflow-hidden">
                    <div className="p-1">
                       <WindowPreview 
                         width={widthWhole * 16 + widthFrac} 
                         height={heightWhole * 16 + heightFrac} 
                         vias={vias} 
                         large={true}
                         windowType={windowType}
                       />
                    </div>

                    <div className="p-6 sm:p-8 pt-0 space-y-6 sm:space-y-8">
                    <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="w-12 h-1 bg-brand-accent rounded-full animate-pulse" />
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Consola Técnica</h2>
                      </div>
                      <div className="px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-lg">
                        <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest">{windowType} EUROPEO</p>
                      </div>
                    </header>

                    <div className="space-y-6">
                      <div className="relative group">
                        <input 
                          type="text" 
                          value={windowTag}
                          onChange={(e) => setWindowTag(e.target.value)}
                          placeholder="Etiqueta"
                          className="w-full h-16 bg-brand-bg border border-brand-border px-6 rounded-2xl text-white font-black text-xl placeholder:text-brand-muted/20 focus:outline-none focus:border-brand-accent transition-all text-center tracking-tighter"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DimensionInput label="Ancho" whole={widthWhole} fraction={widthFrac} onWholeChange={setWidthWhole} onFractionChange={setWidthFrac} />
                        <DimensionInput label="Alto" whole={heightWhole} fraction={heightFrac} onWholeChange={setHeightWhole} onFractionChange={setHeightFrac} />
                      </div>

                      <div className="space-y-4">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">Configuración de Hojas (Vías)</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[2, 3, 4].map((v) => (
                            <button
                              key={v}
                              onClick={() => setVias(v as 2 | 3 | 4)}
                              className={`group relative h-32 rounded-2xl border-2 transition-all flex flex-col items-center justify-between p-3 ${vias === v ? 'bg-brand-accent/10 border-brand-accent shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-brand-bg border-brand-border text-brand-muted hover:border-brand-accent/50'}`}
                            >
                               <div className="w-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                                  <WindowPreview width={v === 2 ? 60 * 16 : v === 3 ? 90 * 16 : 120 * 16} height={60 * 16} vias={v} />
                               </div>
                               <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${vias === v ? 'text-brand-accent' : 'text-brand-muted group-hover:text-white'}`}>
                                 {v} Hojas
                               </span>
                               {vias === v && (
                                 <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-md">
                                    <Check size={8} strokeWidth={4} />
                                 </div>
                               )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleCalculate}
                        className="w-full py-5 bg-white/5 border border-brand-border rounded-2xl text-white font-black uppercase text-xs tracking-[0.3em] hover:bg-brand-accent/10 hover:border-brand-accent transition-all"
                      >
                        Visualizar Cortes
                      </button>
                    </div>

                    {showResults && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pt-6 border-t border-white/5">
                        <ResultsBreakdown results={results} />
                        <button 
                          onClick={addToBatch}
                          className="w-full py-6 bg-brand-accent rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase text-xs shadow-xl"
                        >
                          <Plus size={20} strokeWidth={3} /> Añadir Ventana
                        </button>
                      </motion.div>
                    )}
                  </div>
                </section>

                  {/* Batch Summary */}
                  {orderWindows.length > 0 && (
                    <div className="space-y-6 pt-12">
                      <div className="flex items-center justify-between px-4">
                        <h5 className="text-xs font-black text-brand-muted uppercase tracking-[0.4em]">Resumen de Carga ({orderWindows.length})</h5>
                        <button onClick={saveBatchOrder} className="px-8 py-4 bg-emerald-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                           <Save size={14} /> Finalizar Orden
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {orderWindows.map(p => (
                          <div key={p.id} className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 scale-50"><WindowPreview width={p.width} height={p.height} vias={p.vias} /></div>
                               <div>
                                  <p className="text-sm font-black text-white uppercase italic">{p.name} ({p.vias} Vías - {p.type})</p>
                                  <p className="text-[10px] font-mono text-brand-muted">{formatFraction(p.width)} x {formatFraction(p.height)}</p>
                               </div>
                            </div>
                            <button onClick={() => setOrderWindows(prev => prev.filter(w => w.id !== p.id))} className="text-red-500/40 hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
                  </>
               )}
            </motion.div>
          ) : (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="space-y-8 sm:space-y-12"
            >
              {/* Dashboard Main View (Principal or History) */}
              {!selectedClientName && activeView === 'dashboard' && (
                <ClientDashboard 
                  projects={projects.filter(p => {
                    const group = allByClient.find(g => g.name === p.clientName);
                    return !group || group.progress < 100;
                  })} 
                  onClientClick={(name) => setSelectedClientName(name)} 
                  selectedClientName={selectedClientName}
                  title="Panel de Control"
                  subtitle="Producción Activa"
                />
              )}

              {!selectedClientName && activeView === 'history' && (
                <ClientDashboard 
                  projects={projects.filter(p => {
                    const group = allByClient.find(g => g.name === p.clientName);
                    return group && group.progress === 100;
                  })} 
                  onClientClick={(name) => setSelectedClientName(name)} 
                  selectedClientName={selectedClientName}
                  title="Historial"
                  subtitle="Ordenes Finalizadas"
                />
              )}

              {/* Empty States */}
              {!selectedClientName && activeView === 'dashboard' && projects.filter(p => {
                const group = allByClient.find(g => g.name === p.clientName);
                return !group || group.progress < 100;
              }).length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">¡Todo al día! — No hay ordenes activas</p>
                </div>
                )}

              {!selectedClientName && activeView === 'history' && projects.filter(p => {
                const group = allByClient.find(g => g.name === p.clientName);
                return group && group.progress === 100;
              }).length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <History size={40} className="mx-auto mb-4 text-brand-muted" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Historial Vacío</p>
                </div>
                )}

          {/* 3. Production by Client */}
          {selectedClientName && (
          <section className="space-y-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-brand-accent/10 border border-brand-accent/20 rounded-xl text-brand-accent shadow-sm">
                     <ClipboardList size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-white italic truncate max-w-[200px] sm:max-w-none">{selectedClientName}</h3>
                     <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-medium">Detalles de producción</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                  onClick={() => {
                    const pass = window.prompt("Ingrese contraseña para ELIMINAR CLIENTE:");
                    if (pass === "1989") {
                      if (window.confirm(`¿Seguro que desea eliminar a ${selectedClientName} y todas sus ordenes?`)) {
                        setProjects(prev => prev.filter(p => p.clientName !== selectedClientName));
                        setSelectedClientName(null);
                      }
                    } else if (pass !== null) {
                      window.alert("Contraseña Incorrecta");
                    }
                  }}
                  className="flex-1 sm:flex-none px-5 h-10 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                 >
                   <Trash2 size={14} /> Eliminar
                 </button>
                 <button 
                  onClick={() => setSelectedClientName(null)}
                  className="flex-1 sm:flex-none px-5 h-10 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                 >
                   <ArrowLeft size={14} /> Regresar
                 </button>
               </div>
            </div>

            <div className="space-y-24">
               {allByClient.filter(g => g.name === selectedClientName).map((group) => (
                 <motion.div 
                   layout
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   key={group.name} 
                   className="bg-brand-sidebar/30 border border-brand-border/50 rounded-[3rem] overflow-hidden"
                 >
                   {/* Client Folder Header */}
                   <div className="p-8 pb-12 border-b border-white/5 bg-white/[0.01]">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10">
                         <div className="space-y-4">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
                                 <User size={24} />
                               </div>
                               <div>
                                  <h4 className="text-2xl font-black text-white italic truncate tracking-tight uppercase">{group.name}</h4>
                                  <p className="text-[10px] font-mono text-brand-muted tracking-[0.2em] uppercase opacity-50">Orden de Trabajo</p>
                               </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-[9px] font-mono font-black uppercase text-brand-muted/60">
                               <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                 <Calendar size={12} className="text-brand-accent" />
                                 <span>Entrada: {new Date(group.entryDate).toLocaleDateString()}</span>
                               </div>
                               {group.exitDate && (
                                 <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 rounded-full border border-brand-accent/20 text-brand-accent">
                                   <Clock size={12} />
                                   <span>Egresó: {new Date(group.exitDate).toLocaleDateString()}</span>
                                 </div>
                )}
                               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
                                 <CheckCircle2 size={12} />
                                 <span>{group.doneWindows} / {group.totalWindows} Entregadas</span>
                               </div>
                            </div>
                         </div>

                         <div className="w-full md:w-48 text-right space-y-4">
                            <div className="flex justify-between items-end mb-2">
                               <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Producción</span>
                               <span className="text-3xl font-mono font-black italic text-brand-accent">{group.progress}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${group.progress}%` }}
                                 className="h-full bg-brand-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                               />
                            </div>
                         </div>
                      </div>

                      {/* Client Projects Grid */}
                      <div className="space-y-12">
                         {/* Pending Windows */}
                         {group.pending.length > 0 && (
                           <div className="space-y-6">
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                 <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">En Proceso ({group.pending.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                  {group.pending.map((project) => {
                                    const totalCuts = project.results.marco.length + project.results.hojas.length + project.results.vidrios.length;
                                    const isFullyCut = project.completedCuts.length === totalCuts;
                                    return (
                                      <motion.div
                                        layout
                                        key={project.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`p-6 rounded-[2rem] flex flex-col gap-6 relative group border transition-all cursor-pointer ${
                                          isFullyCut 
                                            ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                                            : 'bg-brand-sidebar/60 border-brand-border hover:border-brand-accent/40'
                                        }`}
                                        onClick={() => setSelectedProject(project)}
                                      >
                                         <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                               <div className="flex items-center gap-2">
                                                 <h4 className={`text-base font-black uppercase truncate pr-4 ${isFullyCut ? 'text-red-400' : 'text-white'}`}>{project.name} ({project.vias} Vías - {project.type})</h4>
                                                 <Info size={14} className={isFullyCut ? 'text-red-500' : 'text-brand-accent opacity-50'} />
                                               </div>
                                               <div className="flex items-center gap-3">
                                                 <p className={`text-[10px] font-mono font-bold tracking-tighter uppercase whitespace-nowrap ${isFullyCut ? 'text-red-500/60' : 'text-brand-accent'}`}>
                                                    {formatFraction(project.width)} x {formatFraction(project.height)}
                                                 </p>
                                               </div>
                                            </div>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} 
                                              className="p-2 rounded-lg hover:bg-red-500/10 text-brand-muted hover:text-red-500 transition-all"
                                            >
                                               <Trash2 size={16} />
                                            </button>
                                         </div>
                  
                                         <div className="relative h-20 flex items-center -mx-2">
                                            <div className={`absolute inset-0 opacity-10 blur-xl rounded-full scale-50 ${isFullyCut ? 'bg-red-500' : 'bg-brand-accent'}`} />
                                            <WindowPreview width={project.width} height={project.height} vias={project.vias} />
                                         </div>
                  
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); toggleProjectStatus(project.id); }}
                                           className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all ${
                                             isFullyCut 
                                                ? 'bg-red-500 text-white shadow-red-500/20' 
                                                : 'bg-brand-accent text-white shadow-brand-accent/20'
                                           }`}
                                         >
                                           <Check size={14} strokeWidth={3} />
                                           {isFullyCut ? 'Corte Finalizado' : 'Confirmar Corte'}
                                         </button>
                                      </motion.div>
                                    );
                                  })}
                                </AnimatePresence>
                              </div>
                           </div>
                )}

                         {/* Completed Windows */}
                         {group.completed.length > 0 && (
                           <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-2 border-t border-white/5 pt-8">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                 <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">Finalizadas ({group.completed.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {group.completed.map((project) => (
                                  <div 
                                    key={project.id}
                                    onClick={() => setSelectedProject(project)}
                                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                                  >
                                     <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                          <Check size={10} strokeWidth={3} />
                                        </div>
                                        <p className="text-[10px] font-black text-white/50 uppercase truncate">{project.name}</p>
                                     </div>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} 
                                       className="p-1.5 text-brand-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                                     >
                                        <Trash2 size={12} />
                                     </button>
                                  </div>
                                ))}
                              </div>
                           </div>
                )}
                      </div>
                   </div>
                 </motion.div>
                ))}

               
               {projects.length === 0 && (
                 <div className="py-20 text-center opacity-10">
                    <p className="text-xs font-black uppercase tracking-[0.5em]">Sistema Vacío — Añada una orden arriba</p>
                 </div>
                )}
            </div>
          </section>
                  )}
               </motion.div>
            )}


    </div>
  </main>

      {/* Global Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[92%] max-w-lg flex items-center gap-1 p-1 bg-brand-sidebar/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <button 
          onClick={() => {
            setActiveView('dashboard');
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest transition-all z-10 ${activeView === 'dashboard' ? 'text-white' : 'text-brand-muted hover:text-white'}`}
        >
          {activeView === 'dashboard' && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <LayoutDashboard size={16} className="relative z-10" /> 
          <span className="relative z-10">Principal</span>
        </button>
        <button 
          onClick={() => {
            setActiveView('history');
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest transition-all z-10 ${activeView === 'history' ? 'text-white' : 'text-brand-muted hover:text-white'}`}
        >
          {activeView === 'history' && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <History size={16} className="relative z-10" /> 
          <span className="relative z-10">Historial</span>
        </button>
        <button 
          onClick={startNewOrder}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[9px] tracking-widest transition-all z-10 ${activeView === 'new-order' ? 'text-white' : 'text-brand-muted hover:text-white'}`}
        >
          {activeView === 'new-order' && (
            <motion.div 
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Plus size={16} className="relative z-10" strokeWidth={3} /> 
          <span className="relative z-10">Nueva Orden</span>
        </button>
      </nav>

      <footer className="py-20 px-4 bg-brand-bg text-center relative z-20">
        <p className="text-[9px] text-brand-muted uppercase tracking-[0.8em] font-black opacity-30">
          HARMONY GLASS • PRODUCTION OS • 2.6.0
        </p>
      </footer>

      {/* Project Detail Portal (Modal) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedProject(null)}
               className="absolute inset-0 bg-brand-bg/95 backdrop-blur-xl"
             />
             
             <motion.div
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="relative w-full max-w-2xl bg-brand-sidebar border-t sm:border border-brand-border rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
             >
                {/* Modal Header */}
                <div className="p-6 sm:p-8 border-b border-brand-border bg-white/[0.02] shrink-0">
                   <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <div className="space-y-1 sm:space-y-2 overflow-hidden">
                         <span className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[8px] font-black text-brand-accent uppercase tracking-widest">Corte Detallado</span>
                         <h2 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase truncate">{selectedProject.name}</h2>
                      </div>
                      <button 
                        onClick={() => setSelectedProject(null)}
                        className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-brand-muted hover:text-white transition-all shrink-0"
                      >
                         <Plus size={20} className="rotate-45" />
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-4 sm:gap-6">
                      <div className="scale-75 sm:scale-50 origin-left w-16 sm:w-24 shrink-0 overflow-hidden">
                         <WindowPreview width={selectedProject.width} height={selectedProject.height} />
                      </div>
                      <div className="flex flex-col gap-2 sm:gap-3 overflow-hidden">
                         <div className="space-y-0.5">
                            <p className="text-[7px] sm:text-[9px] text-brand-muted uppercase font-black tracking-widest opacity-30 italic">Medidas Vano</p>
                            <p className="text-sm sm:text-lg font-mono font-black text-white tabular-nums italic">
                               {formatFraction(selectedProject.width)} <span className="text-brand-accent">x</span> {formatFraction(selectedProject.height)}
                            </p>
                         </div>
                         <div className="flex items-center gap-3 sm:gap-4">
                            <div className="space-y-0.5 shrink-0">
                               <p className="text-[7px] text-brand-muted uppercase font-black opacity-30">Alta</p>
                               <p className="text-[9px] font-mono text-white/60">{new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                            </div>
                            {selectedProject.deliveryDate && (
                              <div className="space-y-0.5 shrink-0">
                                 <p className="text-[7px] text-brand-muted uppercase font-black opacity-30">Salida</p>
                                 <p className="text-[9px] font-mono text-brand-accent">{new Date(selectedProject.deliveryDate).toLocaleDateString()}</p>
                              </div>
                )}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Modal Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                   <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                         <Clock size={16} className="text-amber-500" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">Checklist de Producción</span>
                      </div>
                      <div className="text-[9px] font-mono text-brand-muted uppercase">
                        {selectedProject.completedCuts.length} de {(selectedProject.results.marco.length + selectedProject.results.hojas.length + selectedProject.results.vidrios.length)} CORTES
                      </div>
                   </div>
                   
                   <ResultsBreakdown 
                     results={selectedProject.results} 
                     completedCuts={selectedProject.completedCuts}
                     onToggleCut={(cutId) => toggleCutStatus(selectedProject.id, cutId)}
                   />
                   
                   <div className="p-6 bg-brand-bg/50 border border-brand-border rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3">
                         <Info size={16} className="text-brand-accent" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">Información Adicional</span>
                      </div>
                      <p className="text-xs text-brand-muted leading-relaxed">
                         Este desglose ha sido calculado utilizando el estándar de ingeniería para perfiles de 2 pulgadas. Asegurese de verificar las tolerancias de ±1/16" durante el proceso de corte.
                      </p>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-brand-border bg-white/[0.02] shrink-0">
                   <button 
                     onClick={() => setSelectedProject(null)}
                     className="w-full h-14 bg-white/5 border border-brand-border rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                   >
                      Cerrar Panel
                   </button>
                </div>
             </motion.div>
          </div>
                )}
      </AnimatePresence>

      {/* Security Check Portal (Modal) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAuthModalOpen(false)}
               className="absolute inset-0 bg-brand-bg/90 backdrop-blur-2xl"
             />
             
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-xs bg-brand-sidebar border border-brand-border rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center gap-8"
             >
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
                      <AlertTriangle size={24} />
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Acceso Restringido</h3>
                   <p className="text-[10px] text-brand-muted uppercase tracking-widest leading-loose">Ingrese clave de autorización para eliminar el registro</p>
                </div>

                <div className="flex gap-3 h-12">
                   {[1, 2, 3, 4].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${passInput.length > i ? 'bg-brand-accent border-brand-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-brand-border'}`} 
                      />
                   ))}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                   {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0].map((val) => (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        key={val}
                        onClick={() => {
                          if (val === "C") setPassInput("");
                          else if (passInput.length < 4) setPassInput(prev => prev + val);
                        }}
                        className={`h-14 rounded-2xl flex items-center justify-center font-mono font-black border transition-all ${
                          val === "C" ? 'bg-red-500/10 border-red-500/20 text-red-500 text-xs' : 'bg-white/5 border-white/10 text-white text-xl'
                        }`}
                      >
                         {val}
                      </motion.button>
                   ))}
                   <motion.button 
                     whileTap={{ scale: 0.9 }}
                     onClick={confirmDeletion}
                     className="h-14 bg-brand-accent text-white rounded-2xl flex items-center justify-center border border-brand-accent shadow-lg shadow-brand-accent/20"
                   >
                     <Check size={20} strokeWidth={3} />
                   </motion.button>
                </div>

                <button 
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] hover:text-white transition-colors"
                >
                   Cancelar Transacción
                </button>
             </motion.div>
          </div>
                )}
      </AnimatePresence>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
