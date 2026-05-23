/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import {
  Info,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  Calculator,
  Check,
  Trash2,
  Plus,
  Clock,
  History,
  ClipboardList,
  User,
  Calendar,
  CheckCircle2,
  Phone,
  MapPin,
  LayoutDashboard,
  ArrowLeft,
  ArrowRight,
  Save,
  Printer,
  X,
  Download,
  Upload,
  Share2,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
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
  clientPhone?: string;
  clientLocation?: string;
  type: "P65" | "P92" | "VENTILADA" | "GAVETAS" | "PUERTA_COMERCIAL" | "COCINA_MODULAR";
  width: number; // sixteenths
  height: number; // sixteenths
  vias: 1 | 2 | 3 | 4 | 5 | 6;
  wTop?: number;
  wBottom?: number;
  hLeft?: number;
  hRight?: number;
  results: {
    marco: CutDetail[];
    hojas: CutDetail[];
    vidrios: CutDetail[];
  };
  completedCuts: string[]; // List of CutDetail IDs that are finished
  status: "pending" | "completed";
  qty?: number;
  createdAt: number;
  deliveryDate?: string;
  aluminioColor?: string;
}

// --- Brand & Logo ---

const BrandLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Clean White Background for the icon itself if needed, but here we use transparency */}
    {/* Tall Modernist Building */}
    <motion.rect 
      initial={{ height: 0 }}
      animate={{ height: 80 }}
      transition={{ duration: 1, ease: "easeOut" }}
      x="30" y="10" width="25" height="80" fill="#dc2626" rx="1" 
    />
    <path d="M30 25 H55 M30 40 H55 M30 55 H55 M30 70 H55 M38 10 V90 M46 10 V90" stroke="white" strokeWidth="0.5" opacity="0.3" />
    
    {/* Skyscraper 2 */}
    <motion.rect 
      initial={{ height: 0 }}
      animate={{ height: 60 }}
      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      x="15" y="30" width="15" height="60" fill="#1e3a8a" rx="1" 
    />
    
    {/* Foreground House icon */}
    <motion.path 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      d="M50 55 L75 35 L100 55 V85 H50 Z" fill="#1e40af" 
    />
    <path d="M50 55 L75 35 L100 55" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="70" y="65" width="10" height="20" fill="white" rx="1" />
    <circle cx="78" cy="75" r="1.5" fill="#1e40af" />
  </svg>
);

const BrandingText = () => (
  <div className="flex flex-col">
    <h1 className="text-xl sm:text-2xl font-black tracking-tighter m-0 leading-none uppercase italic">
      <span className="text-red-600 drop-shadow-[0_2px_0_rgba(0,0,0,1)]">HARMONY</span>
      <span className="text-blue-400 ml-1.5 drop-shadow-[0_2px_4px_rgba(30,58,138,0.4)]">GLASS</span>
    </h1>
    <span className="text-[10px] sm:text-xs font-bold text-brand-muted uppercase tracking-[0.2em] leading-tight opacity-70">
      Sistemas de Aluminio y Vidrio
    </span>
  </div>
);

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

function parseFractionInches(str: string): number {
  if (!str) return 0;
  const trimmed = str.replace('"', "").replace('"', "").trim();
  const parts = trimmed.split(" ");
  if (parts.length === 2) {
    const whole = parseFloat(parts[0]);
    const fracParts = parts[1].split("/");
    if (fracParts.length === 2) {
      return whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1]));
    }
    return whole;
  } else if (parts.length === 1) {
    if (parts[0].includes("/")) {
      const fracParts = parts[0].split("/");
      if (fracParts.length === 2) {
        return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
      }
    }
    return parseFloat(parts[0]) || 0;
  }
  return 0;
}

function formatDimensionSet(w: number, h: number): string {
  const fw = formatFraction(w).replace('"', "");
  const fh = formatFraction(h).replace('"', "");
  return `${fw} x ${fh}`;
}

function PrintReport({
  clientName,
  projects,
  onExit,
  linearPrice,
  setLinearPrice,
  barLength,
  setBarLength,
}: {
  clientName: string;
  projects: WindowProject[];
  onExit: () => void;
  linearPrice: number;
  setLinearPrice: (v: number) => void;
  barLength: number;
  setBarLength: (v: number) => void;
}) {
  // Helper to find a dimension by piece name
  const getS = (items: CutDetail[], name: string) => {
    const item = items.find((i) =>
      i.piece.toLowerCase().includes(name.toLowerCase()),
    );
    return item ? formatFraction(item.size) : "";
  };

  const getD = (items: CutDetail[], name: string) => {
    const item = items.find((i) =>
      i.piece.toLowerCase().includes(name.toLowerCase()),
    );
    return item?.dimensions || (item ? formatFraction(item.size) : "");
  };

  // Group by Window Type (Equipo)
  const grouped = projects.reduce(
    (acc, p) => {
      const type = p.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(p);
      return acc;
    },
    {} as Record<string, WindowProject[]>,
  );

  return (
    <div className="fixed inset-0 z-[500] bg-white text-black p-2 sm:p-4 overflow-y-auto font-sans print:p-0 print:relative print:block print:z-0 print:bg-white print:min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex justify-between items-center border-b-2 border-black pb-2 print:hidden">
          <div className="flex items-center gap-4">
            <BrandLogo className="w-10 h-10" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-tighter leading-none">
                <span className="text-red-600">HARMONY</span> <span className="text-blue-700">GLASS</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Planilla Técnica de Corte</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.print();
              }}
              className="px-6 h-8 bg-red-600 text-white rounded-lg font-black uppercase text-[10px] flex items-center gap-2 shadow-lg hover:bg-red-700 transition-all"
            >
              <Printer size={14} /> Imprimir Reporte
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onExit();
              }}
              className="px-4 h-8 bg-black text-white rounded-lg font-black uppercase text-[10px] flex items-center gap-2"
            >
              <X size={14} /> Cerrar
            </button>
          </div>
        </div>

        <div className="flex justify-between items-baseline border-b border-gray-100 pb-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">
              Cliente:
            </span>
            <h2 className="text-lg font-black uppercase tracking-tighter">
              {clientName}
            </h2>
          </div>
        </div>
        {/* Grouped Tables */}
        {Object.entries(grouped).map(([type, typeProjects]) => (
          <div
            key={type}
            className="space-y-2 break-inside-avoid shadow-none pt-1"
          >
            <div className="border-b border-black pb-0.5">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-black">
                SISTEMA: {type}
              </h3>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  {type === "GAVETAS" ? (
                    <tr className="bg-white text-black font-black uppercase tracking-tighter text-[7px] border-b-2 border-black">
                      <th className="border border-black px-1 py-1 w-12">#</th>
                      <th className="border border-black px-1 py-1 w-20">Hueco</th>
                      <th className="border border-black px-1 py-1" colSpan={2}>MOLDURAS</th>
                      <th className="border border-black px-1 py-1" colSpan={2}>FACIAS</th>
                    </tr>
                  ) : type === "PUERTA_COMERCIAL" ? (
                    <tr className="bg-white text-black font-black uppercase tracking-tighter text-[7px] border-b-2 border-black">
                      <th className="border border-black px-1 py-1 w-12">#</th>
                      <th className="border border-black px-1 py-1 w-20">HUECO</th>
                      <th className="border border-black px-1 py-1">DINTEL</th>
                      <th className="border border-black px-1 py-1">JAMBA</th>
                      <th className="border border-black px-1 py-1">LATERAL</th>
                      <th className="border border-black px-1 py-1">CABEZAL</th>
                      <th className="border border-black px-1 py-1 w-32">
                        CRISTAL
                      </th>
                    </tr>
                  ) : (
                    <tr className="bg-white text-black font-black uppercase tracking-tighter text-[7px] border-b-2 border-black">
                      <th className="border border-black px-1 py-1 w-12">#</th>
                      <th className="border border-black px-1 py-1 w-20">
                        Hueco
                      </th>
                      <th className="border border-black px-1 py-1">Jamba</th>
                      <th className="border border-black px-1 py-1">
                        Alf / Rueda
                      </th>
                      <th className="border border-black px-1 py-1">Lateral</th>
                      <th className="border border-black px-1 py-1">Rieles</th>
                      <th className="border border-black px-1 py-1 w-32">
                        CRISTAL (VIDRIO)
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="font-mono font-bold">
                  {typeProjects.map((p, pIdx) => {
                    const combinedHoja = p.results.hojas;
                    const combinedMarco = p.results.marco;
                    const combinedVidrio = p.results.vidrios;
 
                    if (type === "GAVETAS") {
                      const moldura = combinedMarco.find(m => m.id === "moldura");
                      const facia = combinedHoja.find(h => h.id === "facia");
                      
                      return (
                        <tr key={p.id} className="text-center border-b border-black break-inside-avoid">
                          <td className="border border-black px-0.5 py-0.5 text-black leading-none bg-gray-50/50">
                            <span className="text-[11px] font-black">{pIdx + 1}</span>
                          </td>
                          <td className="border border-black px-1 py-0.5">
                            <div className="text-[12px] font-black text-black">
                              {formatDimensionSet(p.width, p.height)}
                            </div>
                          </td>
                          <td className="border border-black px-1 py-1" colSpan={2}>
                            {moldura && (
                              <div className="flex flex-col gap-0.5 leading-none">
                                <span className="text-[14px] font-black text-black">
                                  {formatFraction(moldura.size)}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="border border-black px-1 py-1" colSpan={2}>
                            {facia && (
                              <div className="flex flex-col gap-0.5 leading-none">
                                <span className="text-[14px] font-black text-black">
                                  {formatFraction(facia.size)}
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    }

                    if (type === "PUERTA_COMERCIAL") {
                      return (
                        <tr key={p.id} className="text-center border-b border-black break-inside-avoid">
                           <td className="border border-black px-0.5 py-0.5 text-black leading-none uppercase">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[11px] font-black">{p.name}</span>
                              <span className="text-[7px] font-bold opacity-60 whitespace-nowrap">{p.vias === 2 ? "DOBLE" : "SIMPLE"}</span>
                            </div>
                          </td>
                          <td className="border border-black px-1 py-0.5">
                            <div className="flex items-center justify-center min-w-[75px] leading-tight text-[12px] font-black text-black">
                              {formatDimensionSet(p.width, p.height)}
                            </div>
                          </td>
                          <td className="border border-black px-0.5 py-0.5">
                            <div className="flex flex-col leading-none">
                              <span className="text-[12px] font-black text-black">{getS(combinedMarco, "DINTEL")}</span>
                              <span className="text-[9px] font-bold text-black opacity-40">x1</span>
                            </div>
                          </td>
                          <td className="border border-black px-0.5 py-0.5">
                            <div className="flex flex-col leading-none">
                              <span className="text-[12px] font-black text-black">{getS(combinedMarco, "JAMBA")}</span>
                              <span className="text-[9px] font-bold text-black opacity-40">x2</span>
                            </div>
                          </td>
                          <td className="border border-black px-0.5 py-0.5">
                            <div className="flex flex-col leading-none">
                              <span className="text-[12px] font-black text-black">{getS(combinedHoja, "LATERAL")}</span>
                              <span className="text-[9px] font-bold text-black opacity-40">x{p.vias * 2}</span>
                            </div>
                          </td>
                          <td className="border border-black px-0.5 py-0.5">
                            <div className="flex flex-col leading-none">
                              <span className="text-[12px] font-black text-black">{getS(combinedHoja, "CABEZAL")}</span>
                              <span className="text-[9px] font-bold text-black opacity-40">x{p.vias * 2}</span>
                            </div>
                          </td>
                          <td className="border border-black px-1 py-0.5 font-black text-black">
                             <div className="flex items-center justify-center gap-2">
                              <span className="text-[13px] tracking-tight tabular-nums leading-none">{getD(combinedVidrio, "Cristal")}</span>
                              <span className="text-[9px] font-bold text-black opacity-40">x{p.vias}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }


                    return (
                      <tr
                        key={p.id}
                        className="text-center border-b border-black break-inside-avoid"
                      >
                        <td className="border border-black px-0.5 py-0.5 text-black leading-none uppercase">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-black">
                              {pIdx + 1}
                            </span>
                            <span className="text-[7px] font-bold opacity-60 whitespace-nowrap">
                              {p.vias} Vías
                            </span>
                            {p.name && (
                              <span className="text-[5px] font-black opacity-60 tracking-widest truncate w-10">
                                {p.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="border border-black px-1 py-0.5">
                          <div className="flex items-center justify-center min-w-[75px] leading-tight text-[12px] font-black text-black">
                            {formatDimensionSet(p.width, p.height)}
                          </div>
                        </td>

                        <td className="border border-black px-0.5 py-0.5">
                          <div className="flex items-center justify-center gap-1 leading-none">
                            <span className="text-[12px] font-black text-black">
                              {getS(combinedHoja, "Jamba")}
                            </span>
                            <span className="text-[9px] font-bold text-black opacity-40">
                              x{p.vias * 2}
                            </span>
                          </div>
                        </td>
                        <td className="border border-black px-0.5 py-0.5">
                          <div className="flex items-center justify-center gap-1 leading-none">
                            <span className="text-[12px] font-black text-black">
                              {getS(combinedHoja, "Alf / Rueda")}
                            </span>
                            <span className="text-[9px] font-bold text-black opacity-40">
                              x{p.vias * 2}
                            </span>
                          </div>
                        </td>
                        <td className="border border-black px-0.5 py-0.5">
                          <div className="flex items-center justify-center gap-1 leading-none">
                            <span className="text-[12px] font-black text-black">
                              {getS(combinedMarco, "Lateral")}
                            </span>
                            <span className="text-[9px] font-bold text-black opacity-40">
                              x2
                            </span>
                          </div>
                        </td>
                        <td className="border border-black px-0.5 py-0.5">
                          <div className="flex items-center justify-center gap-1 leading-none">
                            <span className="text-[12px] font-black text-black">
                              {getS(combinedMarco, "Rieles")}
                            </span>
                            <span className="text-[9px] font-bold text-black opacity-40">
                              x2
                            </span>
                          </div>
                        </td>

                        <td className="border border-black px-1 py-0.5 font-black text-black">
                          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                            {combinedVidrio.map((v, vIdx) => (
                              <div key={vIdx} className="flex items-center justify-center gap-1 leading-none">
                                <span className="text-[12px] tracking-tight tabular-nums leading-none font-black text-black">
                                  {v.dimensions || formatFraction(v.size)}
                                </span>
                                <span className="text-[8px] font-bold text-black/55 whitespace-nowrap">
                                  ({v.piece.includes("Menos") ? "M. 3/8\"" : "Ppal."}) x{v.qty}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}



        <div className="flex justify-between items-center pt-4 border-t border-black/5 transition-opacity hover:opacity-100 opacity-30 italic text-[7px] font-black uppercase tracking-widest leading-none">
          <div className="flex items-center gap-2">
            <BrandLogo className="w-5 h-5 filter grayscale" />
            <div className="flex items-center gap-1.5">
              <span className="text-red-700">HARMONY</span> 
              <span className="text-blue-700 underline decoration-red-700/20 underline-offset-2">GLASS</span> 
              <span className="opacity-50">INDUSTRIAL PRODUCTION — SHEET ENHANCED</span>
            </div>
          </div>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

const CLIENT_COLORS = [
  {
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    accent: "text-blue-400",
    bar: "bg-blue-500",
    shadow: "shadow-blue-500/20",
  },
  {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    accent: "text-emerald-400",
    bar: "bg-emerald-500",
    shadow: "shadow-emerald-500/20",
  },
  {
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    accent: "text-violet-400",
    bar: "bg-violet-500",
    shadow: "shadow-violet-500/20",
  },
  {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    accent: "text-amber-400",
    bar: "bg-amber-500",
    shadow: "shadow-amber-500/20",
  },
  {
    bg: "bg-rose-500/5",
    border: "border-rose-500/20",
    accent: "text-rose-400",
    bar: "bg-rose-500",
    shadow: "shadow-rose-500/20",
  },
  {
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
    accent: "text-cyan-400",
    bar: "bg-cyan-500",
    shadow: "shadow-cyan-500/20",
  },
];

function ClientDashboard({
  projects,
  onClientClick,
  selectedClientName,
  title,
  subtitle,
}: {
  projects: WindowProject[];
  onClientClick?: (clientName: string) => void;
  selectedClientName?: string | null;
  title?: string;
  subtitle?: string;
}) {
  const statsByClient = useMemo(() => {
    const groups: Record<
      string,
      {
        count: number;
        done: number;
        entryDate: number;
        exitDate?: string;
        pendingCuts: number;
        hasDoor: boolean;
      }
    > = {};

    projects.forEach((p) => {
      if (!groups[p.clientName]) {
        groups[p.clientName] = {
          count: 0,
          done: 0,
          entryDate: p.createdAt,
          exitDate: p.deliveryDate,
          pendingCuts: 0,
          hasDoor: false,
        };
      }
      if (p.type === "PUERTA_COMERCIAL") groups[p.clientName].hasDoor = true;
      groups[p.clientName].count++;
      if (p.status === "completed") groups[p.clientName].done++;

      const totalCuts =
        p.results.marco.length +
        p.results.hojas.length +
        p.results.vidrios.length;
      groups[p.clientName].pendingCuts += totalCuts - p.completedCuts.length;

      if (p.createdAt < groups[p.clientName].entryDate) {
        groups[p.clientName].entryDate = p.createdAt;
      }
      // Use the latest delivery date found as the finish target
      if (
        p.deliveryDate &&
        (!groups[p.clientName].exitDate ||
          new Date(p.deliveryDate) > new Date(groups[p.clientName].exitDate))
      ) {
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
          const colorIndex =
            Math.abs(
              name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0),
            ) % CLIENT_COLORS.length;
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
                  ? "bg-brand-sidebar border-brand-accent ring-4 ring-brand-accent/20 scale-[1.02]"
                  : isComplete
                    ? "bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    : `${clientColor.bg} ${clientColor.border} hover:border-white/20 transition-all hover:scale-[1.01]`
              }`}
            >
              <div className="absolute top-0 right-0 p-5 opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:opacity-10 transition-all duration-500">
                <User
                  size={100}
                  className={
                    isComplete ? "text-emerald-500" : clientColor.accent
                  }
                />
              </div>

              <div className="relative z-10 space-y-5">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <p
                      className={`text-[8px] font-black uppercase tracking-widest opacity-70 ${isComplete ? "text-emerald-400" : clientColor.accent}`}
                    >
                      Cliente
                    </p>
                    {isComplete && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest animate-pulse">
                        Completado
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-xl font-black italic truncate pr-4 ${isComplete ? "text-emerald-100" : "text-white"}`}
                  >
                    {name}
                  </h3>
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
                      <RotateCcw
                        size={8}
                        className={
                          isComplete ? "text-emerald-400" : clientColor.accent
                        }
                      />{" "}
                      Termina
                    </p>
                    <p
                      className={`text-[10px] font-mono font-bold ${isComplete ? "text-emerald-400" : clientColor.accent}`}
                    >
                      {data.exitDate
                        ? new Date(data.exitDate).toLocaleDateString()
                        : "Pendiente"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] text-brand-muted uppercase font-black tracking-widest opacity-50">
                    Detalles de Orden
                  </p>
                  <div className="flex justify-between items-center mb-1 px-0.5">
                    <p
                      className={`text-[10px] font-black uppercase tracking-widest ${isComplete ? "text-emerald-400" : clientColor.accent}`}
                    >
                      {data.count} {data.count === 1 ? (data.hasDoor ? "Puerta" : "Ventana") : (data.hasDoor ? "Puertas/Ventanas" : "Ventanas")}
                    </p>
                    <p
                      className={`text-xs font-black italic tabular-nums ${isComplete ? "text-emerald-100" : "text-white"}`}
                    >
                      {progress}%
                    </p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className={`h-full ${isComplete ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : `${clientColor.bar} shadow-[0_0_10px_${clientColor.bar === "bg-blue-500" ? "rgba(59,130,246,0.5)" : "rgba(0,0,0,0.5)"}]`}`}
                      style={{
                        backgroundColor: isComplete
                          ? undefined
                          : clientColor.bar.replace("bg-", ""),
                      }}
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

function PurchaseDetail({
  projects,
  linearPrice,
  setLinearPrice,
  barLength,
  setBarLength,
}: {
  projects: WindowProject[];
  linearPrice: number;
  setLinearPrice: (v: number) => void;
  barLength: number;
  setBarLength: (v: number) => void;
}) {
  const barLengthSixteenths = 250 * 16; // 250 pulgadas por barra (estándar de taller)
  const stockLot = 250 * 12 * 16; // 250 feet in sixteenths

  // Group all linear pieces from all projects by piece name
  const piecesByName: Record<string, { size: number; qty: number }[]> = {};
  projects.forEach((p) => {
    if (!p.width || !p.height) return; // Skip windows with zero dimensions
    [...p.results.marco, ...p.results.hojas].forEach((item) => {
      if (!piecesByName[item.piece]) piecesByName[item.piece] = [];
      piecesByName[item.piece].push({ size: item.size, qty: item.qty });
    });
  });

  const totalWindows = projects.reduce((sum, p) => {
    if (!p.width || !p.height) return sum;
    return sum + (p.qty || 1);
  }, 0);
  const accessorySummary = [
    { name: "Ruedas de Ventana", qty: totalWindows * 2, unit: "Unidades" },
    { name: "Kit de Guías / Plásticos", qty: totalWindows, unit: "Kit" },
    { name: "Puñito", qty: totalWindows, unit: "Unidades" },
  ];

  const summary = Object.entries(piecesByName).map(([name, pieces], index) => {
    // Group pieces by their exact size in sixteenths
    const sizeGroups: Record<number, number> = {};
    pieces.forEach((p) => {
      sizeGroups[p.size] = (sizeGroups[p.size] || 0) + p.qty;
    });

    let totalBars = 0;
    Object.entries(sizeGroups).forEach(([sizeStr, qty]) => {
      const sizeVal = parseFloat(sizeStr);
      const sizeInches = sizeVal / 16;
      const piecesPerBar = Math.floor(250 / sizeInches);
      if (piecesPerBar <= 0) {
        totalBars += qty;
      } else {
        totalBars += Math.ceil(qty / piecesPerBar);
      }
    });

    const totalFeetUsed = totalBars * (250 / 12);
    const cost = totalFeetUsed * linearPrice;

    return {
      index: index + 1,
      name,
      bars: totalBars,
      cost,
      totalSixteenths: totalBars * barLengthSixteenths,
      barDetails: [],
    };
  });

  const grandTotalCost = summary.reduce((sum, s) => sum + s.cost, 0);
  const totalSixteenthsUsed = summary.reduce(
    (sum, s) => sum + s.totalSixteenths,
    0,
  );
  
  // Real linear consumption (only pieces, not full bars)
  const actualUsedSixteenths = Object.values(piecesByName).reduce((sum, pieces) => {
    return sum + pieces.reduce((s, p) => s + (p.size * p.qty), 0);
  }, 0);

  const remainingSixteenths = stockLot - actualUsedSixteenths;
  const remainingFeet = remainingSixteenths / (12 * 16);
  const consumptionPercent = Math.min(100, (actualUsedSixteenths / stockLot) * 100);

  return (
    <div className="mt-8 p-6 bg-brand-sidebar/40 border-2 border-brand-border rounded-[2.5rem] space-y-6 print:hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
        <div>
          <h4 className="text-xl font-black text-white italic tracking-tighter uppercase print:text-black">
            Uso de Lote
          </h4>
          <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest print:hidden mb-2">
            Optimización y Consumo de Perfilería
          </p>
        </div>
        <div className="text-right w-full sm:w-auto p-4 bg-black/20 rounded-2xl border border-brand-border/50">
          <div className="flex justify-between sm:block gap-4">
            <div className="space-y-1">
               <p className="text-[7px] font-black text-brand-muted uppercase tracking-widest mb-1">
                Uso del Lote (250')
               </p>
               <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden print:hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${consumptionPercent}%` }}
                    className={`h-full ${consumptionPercent > 90 ? "bg-red-500" : consumptionPercent > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  />
               </div>
               <p className="text-[10px] text-white font-black uppercase">
                  {consumptionPercent.toFixed(1)}% Consumido
               </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="px-4 text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] opacity-60">
          Perfiles de Aluminio
        </h5>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-brand-border text-xs print:border-black">
            <thead>
              <tr className="bg-brand-sidebar/60 text-brand-muted font-black uppercase tracking-widest text-[9px] print:bg-gray-100 print:text-black print:border-black">
                <th className="border-2 border-brand-border px-4 py-3 text-left print:border-black w-10">
                  #
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-left print:border-black">
                  Descripción del Perfil
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-center print:border-black">
                  Corte Lineal
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-center print:border-black">
                  Barras (250")
                </th>
              </tr>
            </thead>
            <tbody className="font-mono font-bold">
              {summary.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-brand-border print:border-black print:text-black hover:bg-white/5"
                >
                  <td className="border-2 border-brand-border px-4 py-3 text-left print:border-black text-brand-muted print:text-black">
                    {row.index}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-left italic print:border-black text-white print:text-black font-black">
                    {row.name}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-center print:border-black text-brand-accent print:text-black">
                    {Object.values(piecesByName[row.name]).reduce((sum, p) => sum + (p.size * p.qty), 0) / (12 * 16) >= 1 
                      ? (Object.values(piecesByName[row.name]).reduce((sum, p) => sum + (p.size * p.qty), 0) / (12 * 16)).toFixed(1) + " FT"
                      : "—"}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-center print:border-black text-white print:text-black">
                    {row.bars}
                  </td>
                </tr>
              ))}
              {summary.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-brand-muted italic opacity-30">
                    No hay perfiles registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h5 className="px-4 pt-2 text-[9px] font-black text-brand-muted uppercase tracking-[0.3em] opacity-60">
          Accesorios Requeridos
        </h5>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-brand-border text-xs print:border-black">
            <thead>
              <tr className="bg-brand-sidebar/60 text-brand-muted font-black uppercase tracking-widest text-[9px] print:bg-gray-100 print:text-black print:border-black">
                <th className="border-2 border-brand-border px-4 py-3 text-left print:border-black w-10">
                  #
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-left print:border-black">
                  Accesorio
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-center print:border-black">
                  Cantidad
                </th>
                <th className="border-2 border-brand-border px-4 py-3 text-right print:border-black">
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody className="font-mono font-bold">
              {accessorySummary.map((acc, idx) => (
                <tr key={acc.name} className="border-b border-brand-border print:border-black print:text-black">
                  <td className="border-2 border-brand-border px-4 py-3 text-left print:border-black text-brand-muted">
                    {idx + 1}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-left text-white print:text-black uppercase">
                    {acc.name}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-center text-emerald-400 print:text-black font-black text-lg">
                    {acc.qty}
                  </td>
                  <td className="border-2 border-brand-border px-4 py-3 text-right text-brand-muted print:text-black italic">
                    {acc.unit}
                  </td>
                </tr>
              ))}
              {totalWindows === 0 && (
                <tr>
                   <td colSpan={4} className="px-4 py-8 text-center text-brand-muted italic opacity-30">
                    Agregue ventanas para ver accesorios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function ResultsBreakdown({
  results,
  windowType,
  completedCuts = [],
  onToggleCut,
}: {
  results: WindowProject["results"];
  windowType: WindowProject["type"];
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

  const categories = windowType === "PUERTA_COMERCIAL"
    ? [
        { 
          title: "PUERTA", 
          items: [
            results.marco.find(i => i.id === "dintel")!,
            results.hojas.find(i => i.id === "lateral")!,
            results.marco.find(i => i.id === "jamba")!,
            results.hojas.find(i => i.id === "cabezal")!,
          ], 
          color: "blue" 
        },
        { 
          title: "CRISTAL", 
          items: results.vidrios, 
          color: "emerald" 
        },
      ]
    : [
        { 
          title: windowType === "GAVETAS" ? "M. MOLDURAS" : windowType === "COCINA_MODULAR" ? "ESTRUCTURA" : "M. Marco", 
          items: results.marco, 
          color: "blue" 
        },
        { 
          title: windowType === "GAVETAS" ? "M. FACIAS" : windowType === "COCINA_MODULAR" ? "PUERTAS" : "M. Hojas", 
          items: results.hojas, 
          color: "purple" 
        },
        { title: "M. Cristal", items: results.vidrios, color: "emerald" },
      ];

  return (
    <div className={`grid grid-cols-1 ${windowType === "PUERTA_COMERCIAL" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"} gap-2 sm:gap-3`}>
      {categories.map((cat) => {
        if (!cat) return null;
        if ((windowType === "GAVETAS" || windowType === "COCINA_MODULAR") && cat.title === "M. Cristal") return null;

        return (
          <div
            key={cat.title}
          className="bg-brand-sidebar/40 border border-brand-border p-3 rounded-[1.2rem] relative overflow-hidden"
        >
          <h5 className="text-[7px] font-black uppercase tracking-[0.4em] text-brand-muted mb-3 px-1">
            {cat.title}
          </h5>
          <div className="space-y-1.5">
            {sortItems(cat.items).map((item) => {
              const isDone = completedCuts.includes(item.id);
              return (
                <motion.div
                  layout
                  key={item.id}
                  onClick={() => onToggleCut?.(item.id)}
                  className={`flex justify-between items-center px-2 py-1.5 rounded-lg border transition-all cursor-pointer group ${
                    isDone
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-white/5 border-transparent hover:border-brand-accent/30"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-all shrink-0 ${
                        isDone
                          ? "bg-red-500 border-red-500"
                          : "border-brand-border bg-brand-bg/50"
                      }`}
                    >
                      {isDone && (
                        <Check
                          size={8}
                          strokeWidth={4}
                          className="text-white"
                        />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <p
                        className={`text-[9px] font-black uppercase tracking-tight leading-none whitespace-nowrap truncate ${isDone ? "text-red-400" : "text-white"}`}
                      >
                        {item.piece}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p
                          className={`text-[11px] font-black italic tabular-nums leading-none ${isDone ? "text-red-300" : "text-brand-accent"}`}
                        >
                          {item.qty}
                        </p>
                        <p
                          className={`text-[6px] font-black uppercase tracking-widest opacity-20 leading-none ${isDone ? "text-red-300" : "text-brand-muted"}`}
                        >
                          Piezas
                        </p>
                      </div>
                    </div>
                  </div>
                  <p
                    className={`text-xs font-mono font-black italic tabular-nums shrink-0 ml-2 ${isDone ? "text-red-500" : "text-brand-accent"}`}
                  >
                    {item.dimensions || formatFraction(item.size)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    })}
  </div>
);
}

function WindowPreview({
  width,
  height,
  vias = 2,
  large = false,
  windowType = "P65",
  wTop,
  wBottom,
  hLeft,
  hRight,
}: {
  width: number;
  height: number;
  vias?: number;
  large?: boolean;
  windowType?: string;
  wTop?: number;
  wBottom?: number;
  hLeft?: number;
  hRight?: number;
}) {
  const baseW = wTop !== undefined && wBottom !== undefined ? Math.max(wTop, wBottom) : width;
  const baseH = hLeft !== undefined && hRight !== undefined ? Math.max(hLeft, hRight) : height;

  // Fallback visual dimensions when real dimensions are zero (60x48 proportion)
  const visualW = baseW || (60 * 16);
  const visualH = baseH || (48 * 16);
  const ratio = visualW / visualH;
  
  // Dynamic max dimensions based on container space
  const maxWidth = large ? (windowType === "PUERTA_COMERCIAL" ? 220 : 280) : 120;
  const maxHeight = large ? (windowType === "PUERTA_COMERCIAL" ? 380 : 180) : 100;

  let scaledW = maxWidth;
  let scaledH = scaledW / ratio;

  if (scaledH > maxHeight) {
    scaledH = maxHeight;
    scaledW = scaledH * ratio;
  }

  // Ensure window doesn't get too small visually, but allow growth
  scaledW = Math.max(scaledW, 40);
  scaledH = Math.max(scaledH, 40);

  return (
    <div
      className={`flex items-center justify-center bg-black/30 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl transition-all duration-700 ${large ? (windowType === "PUERTA_COMERCIAL" ? "h-[450px]" : "h-72") + " w-full p-10" : "h-32 w-full p-4"}`}
    >
      {/* Background Decorative Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <motion.div
        layout
        initial={false}
        animate={{ width: scaledW, height: scaledH }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="border-[4px] border-brand-accent/50 rounded-lg bg-brand-accent/5 relative flex overflow-hidden shadow-2xl transition-[transform,opacity] duration-700 hover:scale-[1.02]"
      >
        {windowType === "PUERTA_COMERCIAL" ? (
          <div className="absolute inset-x-0 inset-y-0 flex bg-brand-accent/5 transition-all duration-700">
             <div className="absolute inset-0 border-[8px] border-brand-accent/40 shadow-inner z-10" />
             <div className="flex-1 border-r-2 border-brand-accent/30 relative overflow-hidden group/door">
                {/* Door Glass */}
                <div className="absolute inset-x-4 top-4 bottom-14 bg-gradient-to-tr from-brand-accent/5 to-brand-accent/20 border border-white/10 shadow-inner flex items-center justify-center">
                   <div className="w-[80%] h-[2px] bg-white/10 rotate-45 transform" />
                </div>
                {/* Door Handle */}
                <div className="absolute right-3 top-[55%] -translate-y-1/2 w-2.5 h-14 bg-brand-accent rounded-sm shadow-xl z-20" />
                {/* Kick plate */}
                <div className="absolute bottom-4 left-4 right-4 h-10 bg-brand-accent/30 border-t border-white/10 z-20" />
             </div>
             {vias === 2 && (
               <div className="flex-1 relative overflow-hidden group/door">
                  {/* Door Glass */}
                  <div className="absolute inset-x-4 top-4 bottom-14 bg-gradient-to-tr from-brand-accent/5 to-brand-accent/20 border border-white/10 shadow-inner flex items-center justify-center">
                    <div className="w-[80%] h-[2px] bg-white/10 rotate-45 transform" />
                  </div>
                  {/* Door Handle */}
                  <div className="absolute left-3 top-[55%] -translate-y-1/2 w-2.5 h-14 bg-brand-accent rounded-sm shadow-xl z-20" />
                  {/* Kick plate */}
                  <div className="absolute bottom-4 left-4 right-4 h-10 bg-brand-accent/30 border-t border-white/10 z-20" />
               </div>
             )}
          </div>
        ) : windowType === "GAVETAS" ? (
          <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center gap-2 p-2 bg-brand-accent/20">
            <div className="w-full h-1/3 border-b border-brand-accent/50 flex items-center justify-center">
              <div className="w-4 h-1 bg-brand-accent rounded-full opacity-50" />
            </div>
            <div className="w-full h-1/3 border-b border-brand-accent/50 flex items-center justify-center">
              <div className="w-4 h-1 bg-brand-accent rounded-full opacity-50" />
            </div>
            <div className="w-full h-1/3 flex items-center justify-center">
              <div className="w-4 h-1 bg-brand-accent rounded-full opacity-50" />
            </div>
          </div>
        ) : windowType === "COCINA_MODULAR" ? (
          <div className="absolute inset-x-0 inset-y-0 flex flex-col items-center justify-center bg-brand-bg transition-all duration-700 p-8">
             <a 
               href="https://cocina-dusky.vercel.app/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="group flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border-2 border-brand-accent/20 bg-brand-accent/5 hover:bg-brand-accent/10 hover:border-brand-accent transition-all duration-500 shadow-2xl hover:shadow-brand-accent/20 text-center max-w-sm"
             >
                <div className="w-24 h-24 rounded-3xl bg-brand-accent flex items-center justify-center text-white shadow-xl shadow-brand-accent/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                   <ExternalLink size={48} />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">
                      Ir al Calculador
                   </h3>
                   <p className="text-[9px] text-brand-muted uppercase tracking-[0.2em] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                      cocina-dusky.vercel.app
                   </p>
                </div>
                <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest group-hover:bg-brand-accent group-hover:border-brand-accent transition-all">
                  Abrir Herramienta
                </div>
             </a>
          </div>
        ) : (
          Array.from({ length: vias }).map((_, i) => {
            const widthPct = 100 / vias;
            const overlapWidth = widthPct * 1.12;
            const isSelected = i % 2 !== 0;

            return (
              <div
                key={i}
                className={`absolute top-0.5 bottom-0.5 border-2 transition-all duration-700 flex items-center justify-center ${
                  isSelected
                    ? "z-10 bg-brand-accent/30 border-brand-accent shadow-[0_0_25px_rgba(59,130,246,0.5)]"
                    : "z-0 bg-brand-accent/10 border-brand-accent/40"
                }`}
                style={{
                  width: `${overlapWidth}%`,
                  left: `${(100 / vias) * i - (i > 0 ? 3 : 0)}%`,
                  borderRadius: "1px",
                }}
              >
                {/* Glass Reflection Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 opacity-40" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/30" />

                {/* Professional Handle simulation */}
                <div
                  className={`w-[2.5px] h-1/4 rounded-full ${isSelected ? "bg-white shadow-[0_0_5px_white]" : "bg-brand-accent/30"} absolute ${i === 0 ? "right-1" : "left-1"}`}
                />
              </div>
            );
          })
        )}
      </motion.div>

      {large && (
        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
           <div className="absolute top-6 left-8">
              <p className="text-[7px] font-black text-brand-muted uppercase tracking-[0.4em]">
                {windowType === "PUERTA_COMERCIAL" ? "Sistema de Acceso" : "Sistema de Cerramiento"}
              </p>
              <h4 className="text-sm font-black text-white italic tracking-tighter uppercase">
                {windowType === "PUERTA_COMERCIAL" ? "PUERTA COMERCIAL" : `${vias} HOJAS / ${windowType.replace("_", " ")}`}
              </h4>
           </div>
           
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <p className="text-xs font-mono font-bold text-brand-accent italic tabular-nums bg-brand-bg/90 px-4 py-2 rounded-full border border-brand-accent/30 shadow-2xl">
                {formatFraction(width)} X {formatFraction(height)}
              </p>
           </div>
        </div>
      )}

      {/* Mini indicator labels for non-large preview */}
      {!large && (
        <>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono font-black text-brand-accent bg-brand-bg/60 px-1 rounded">
            {formatFraction(width)}
          </div>
          <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[7px] font-mono font-black text-brand-accent bg-brand-bg/60 px-1 rounded">
            {formatFraction(height)}
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

function DimensionInput({
  label,
  whole,
  fraction,
  onWholeChange,
  onFractionChange,
}: InputFieldProps) {
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
            value={whole === 0 ? "" : whole}
            onChange={(e) =>
              onWholeChange(Math.max(0, parseInt(e.target.value) || 0))
            }
            placeholder="0"
            className="w-full h-14 bg-brand-sidebar border border-brand-border px-4 rounded-xl text-white font-mono text-xl focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all text-center placeholder:text-brand-muted/30"
          />
          <div className="absolute -top-2 left-3 px-1.5 bg-brand-sidebar text-[8px] font-black text-brand-accent border border-brand-border rounded">
            INT
          </div>
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
          <div className="absolute -top-2 left-3 px-1.5 bg-brand-sidebar text-[8px] font-black text-brand-muted border border-brand-border rounded tracking-tighter">
            FRAC
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [windowTag, setWindowTag] = useState<string>("VENTANA 01");
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientLocation, setClientLocation] = useState<string>("");
  const [aluminioColor, setAluminioColor] = useState<string>("Blanco");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [widthWhole, setWidthWhole] = useState<number>(0);
  const [widthFrac, setWidthFrac] = useState<number>(0);
  const [heightWhole, setHeightWhole] = useState<number>(0);
  const [heightFrac, setHeightFrac] = useState<number>(0);
  const [wTopWhole, setWTopWhole] = useState<number>(0);
  const [wTopFrac, setWTopFrac] = useState<number>(0);
  const [wBottomWhole, setWBottomWhole] = useState<number>(0);
  const [wBottomFrac, setWBottomFrac] = useState<number>(0);
  const [hLeftWhole, setHLeftWhole] = useState<number>(0);
  const [hLeftFrac, setHLeftFrac] = useState<number>(0);
  const [hRightWhole, setHRightWhole] = useState<number>(0);
  const [hRightFrac, setHRightFrac] = useState<number>(0);
  const [vias, setVias] = useState<1 | 2 | 3 | 4 | 5 | 6>(2);
  const [windowType, setWindowType] = useState<
    "P65" | "P92" | "VENTILADA" | "GAVETAS" | "PUERTA_COMERCIAL"
  >("P65");
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const [projects, setProjects] = useState<WindowProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<WindowProject | null>(
    null,
  );
  const [selectedClientName, setSelectedClientName] = useState<string | null>(
    null,
  );
  const [selectedDetailClient, setSelectedDetailClient] = useState<string | null>(null);
  const [expandedWindowId, setExpandedWindowId] = useState<string | null>(null);

  // Navigation & Order Creation State
  const [activeView, setActiveView] = useState<
    "dashboard" | "history" | "new-order" | "unfinished" | "detail"
  >("dashboard");
  const [orderStep, setOrderStep] = useState<1 | 2 | 3>(1);
  const [orderWindows, setOrderWindows] = useState<WindowProject[]>([]);

  // Security State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteUnfinishedId, setPendingDeleteUnfinishedId] = useState<string | null>(null);
  const [pendingDeleteUnfinishedClient, setPendingDeleteUnfinishedClient] = useState<string | null>(null);
  const [selectedUnfinishedClient, setSelectedUnfinishedClient] = useState<string | null>(null);
  const [pendingDeleteClient, setPendingDeleteClient] = useState<string | null>(
    null,
  );
  const [pendingChangeProfile, setPendingChangeProfile] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isSinglePrintMode, setIsSinglePrintMode] = useState(false);
  const [singlePrintProject, setSinglePrintProject] = useState<WindowProject | null>(null);
  const [clientPricing, setClientPricing] = useState<Record<string, number>>({});
  const [linearPrice, setLinearPrice] = useState<number>(0);
  const [barLength, setBarLength] = useState<number>(20);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("v-cut-projects");
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
    const savedPricing = localStorage.getItem("v-cut-pricing");
    if (savedPricing) {
      try {
        setClientPricing(JSON.parse(savedPricing));
      } catch (e) {
        console.error("Failed to load pricing", e);
      }
    }
    const savedLinearPrice = localStorage.getItem("v-cut-linear-price");
    if (savedLinearPrice) setLinearPrice(parseFloat(savedLinearPrice) || 0);
    const savedBarLength = localStorage.getItem("v-cut-bar-length");
    if (savedBarLength) setBarLength(parseFloat(savedBarLength) || 20);

    const savedOrder = localStorage.getItem("v-cut-temp-order");
    if (savedOrder) {
      try {
        setOrderWindows(JSON.parse(savedOrder));
      } catch (e) {
        console.error("Failed to load buffer", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("v-cut-projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("v-cut-pricing", JSON.stringify(clientPricing));
  }, [clientPricing]);

  useEffect(() => {
    localStorage.setItem("v-cut-linear-price", linearPrice.toString());
  }, [linearPrice]);

  useEffect(() => {
    localStorage.setItem("v-cut-bar-length", barLength.toString());
  }, [barLength]);

  useEffect(() => {
    localStorage.setItem("v-cut-temp-order", JSON.stringify(orderWindows));
  }, [orderWindows]);

  const groupedUnfinished = useMemo(() => {
    return orderWindows.reduce((acc, p) => {
      if (!acc[p.clientName]) acc[p.clientName] = [];
      acc[p.clientName].push(p);
      return acc;
    }, {} as Record<string, WindowProject[]>);
  }, [orderWindows]);

  const exportData = () => {
    const data = {
      projects,
      clientPricing,
      exportDate: new Date().toISOString(),
      version: "2.7.0"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `harmony-glass-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.projects && Array.isArray(json.projects)) {
          setProjects(json.projects);
          if (json.clientPricing) setClientPricing(json.clientPricing);
          setActiveView("dashboard");
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          throw new Error("Formato inválido");
        }
      } catch (err) {
        console.error("Error al importar", err);
      }
    };
    reader.readAsText(file);
  };

  const handleShareEmail = async () => {
    const data = {
        projects,
        clientPricing,
        exportDate: new Date().toISOString(),
    };
    const fileName = `harmony-glass-data-${new Date().toISOString().split('T')[0]}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    
    // Attempt to use native Web Share API (supports real file attachments)
    if (navigator.share && navigator.canShare) {
      const file = new File([jsonStr], fileName, { type: 'application/json' });
      const shareData = {
        files: [file],
        title: 'Respaldo Harmony Glass',
        text: 'Datos de pedidos para transferir a otro equipo.'
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error("Error sharing:", err);
          } else {
            return; // User cancelled
          }
        }
      }
    }

    // Fallback for browsers that don't support file sharing
    const subject = encodeURIComponent("Respaldo de Datos - Harmony Glass");
    const body = encodeURIComponent(
        "Hola, adjunto los datos de Harmony Glass.\n\n" +
        "Para restaurarlos:\n" +
        "1. ADJUNTA MANUALMENTE el archivo que se acaba de descargar (" + fileName + ") a este correo.\n" +
        "2. Abre la aplicación en el otro equipo.\n" +
        "3. Pulsa el icono de 'Subir' (Flecha arriba) y selecciona el archivo.\n\n" +
        "--- DATOS DE RESPALDO ---\n" +
        "Fecha: " + new Date().toLocaleString()
    );
    
    exportData();
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const results = useMemo(() => {
    const totalWidth = widthWhole * 16 + widthFrac;
    const totalHeight = heightWhole * 16 + heightFrac;
    const wTop = wTopWhole * 16 + wTopFrac;
    const wBottom = wBottomWhole * 16 + wBottomFrac;
    const hLeft = hLeftWhole * 16 + hLeftFrac;
    const hRight = hRightWhole * 16 + hRightFrac;

    // Specific European Workshop Deductions (Sixteenths)
    let leafVertDeduction = 34; // Jamba 2.125"
    let leafOverlap = 8; // Cabezal 0.5"
    let glassWidthFrameDeduction = 100; // 6.25"
    let glassHeightFrameDeduction = 80; // 5.0"
    let frameHorizDeduction = 22; // Riel 1.375" (Updated from 1.5")
    let frameVertDeduction = 2; // Lateral 0.125"

    // User requested P92 specific discounts
    if (windowType === "P92" || windowType === "PUERTA_COMERCIAL") {
      leafVertDeduction = 48; // Jamba 3.0"
      leafOverlap = 10; // Alféizar deduction per panel (1.25" total / 2)
      frameHorizDeduction = 26; // Riel 1.625" (User request 1.63")
      frameVertDeduction = 2; // Lateral 0.125" (User request 0.13")
      glassWidthFrameDeduction = 46; // Vidrio Ancho 2.875" (User request 2.87")
      glassHeightFrameDeduction = 48; // Vidrio Alto 3.0"
    }

    if (windowType === "PUERTA_COMERCIAL") {
      const dintelSize = totalWidth - 60; // Ancho - 3.75 (3 3/4")
      const lateralSize = totalHeight - 4; // Alto - 0.25 (1/4")
      const jambaSize = totalHeight - 46; // Alto - 2.875 (2 7/8")
      
      // Cabezal formula: (Ancho - 12 1/8") / 2 for double, Ancho - 8 1/8" for single
      const cabezalSize = vias === 2 
        ? Math.floor((totalWidth - 194) / 2)
        : Math.floor(totalWidth - 130);
      const cabezalFormula = vias === 2 ? `(Ancho - 12 1/8") / 2` : `Ancho - 8 1/8"`;
      
      // Glass estimation
      const glassWidth = Math.floor((totalWidth - 160) / vias);
      const glassHeight = totalHeight - 110;

      return {
        inputs: { w: totalWidth, h: totalHeight, type: windowType, vias },
        marco: [
          {
            id: "dintel",
            piece: "DINTEL",
            qty: 1,
            size: dintelSize,
            formula: `Ancho - 3 3/4"`,
          },
          {
            id: "jamba",
            piece: "JAMBA",
            qty: 2,
            size: jambaSize,
            formula: `Alto - 2 7/8"`,
          },
        ],
        hojas: [
          {
            id: "lateral",
            piece: "LATERAL",
            qty: vias * 2,
            size: lateralSize,
            formula: `Alto - 1/4"`,
          },
          {
            id: "cabezal",
            piece: "CABEZAL",
            qty: vias * 2,
            size: cabezalSize,
            formula: cabezalFormula,
          },
        ],
        vidrios: [],
      };
    }

    if (windowType === "GAVETAS") {
      const molduraWidth = totalWidth - 26; // Ancho - 1.625
      const molduraHeight = 72; // Altura siempre 4.5
      const molduraSalida = 210; // Salida siempre 13.125

      const faciaWidth = molduraWidth - 2; // Ancho moldura - 0.125
      const faciaSalida = 202; // Salida siempre 12.625

      return {
        inputs: { w: totalWidth, h: totalHeight, type: windowType, vias },
        marco: [
          {
            id: "moldura",
            piece: "MOLDURA",
            qty: 2 * vias,
            size: molduraWidth,
            formula: `Ancho: ${formatFraction(molduraWidth)} / Alto: ${formatFraction(molduraHeight)} / Salida: ${formatFraction(molduraSalida)}`,
          },
        ],
        hojas: [
          {
            id: "facia",
            piece: "FACIA",
            qty: 1 * vias,
            size: faciaWidth,
            formula: `Ancho: ${formatFraction(faciaWidth)} / Salida: ${formatFraction(faciaSalida)}`,
          },
        ],
        vidrios: [],
      };
    }

    if (windowType === "COCINA_MODULAR") {
      return {
        inputs: { w: totalWidth, h: totalHeight, type: windowType, vias },
        marco: [
          {
             id: "link",
             piece: "IR AL CALCULADOR EXTERNO",
             qty: 1,
             size: 0,
             formula: "Haga clic en el enlace del visor superior",
          }
        ],
        hojas: [],
        vidrios: [],
      };
    }

    let profileName = windowType;

    const sideRailsSize = totalHeight - frameVertDeduction;
    const sillSize = totalWidth - frameHorizDeduction;
    const leafVerticalSize = totalHeight - leafVertDeduction;

    // Width Logic based on Vias
    // Target for 23.63: 11.31 (181/16). 378/2 - 8 = 181.
    // User requested: "(Ancho + 0.75) / 3" which for 88.25 results in exactly 29.66" (29 11/16")
    // Formula for 3 vias in sixteenths: Math.round((totalWidth + 12) / 3)
    // Otherwise standard formula: Ancho / vias - leafOverlap
    let leafHorizontalSize = vias === 3
      ? Math.round((totalWidth + 12) / 3)
      : Math.floor(totalWidth / vias - leafOverlap);

    const leafHorizontalFormula = vias === 3
      ? `(Ancho + 0.75") / 3`
      : `Ancho/${vias} - ${formatFraction(leafOverlap)}`;

    // GLASS FORMULA PER USER: 
    // Width target for 23.63: 8.69 (139/16). (378 - 100) / 2 = 139.
    // For 3 or 4 vias, the glasswidth is based on leafHorizontalSize minus 2.63" (42 sixteenths)
    let glassWidth = Math.floor((totalWidth - glassWidthFrameDeduction) / vias);
    if (vias === 3 || vias === 4) {
      glassWidth = leafHorizontalSize - 42;
    }
    // Height target for 23.63: 18.63 (298/16). 378 - 80 = 298.
    const glassHeight = totalHeight - glassHeightFrameDeduction;

    // Second glass width calculation: "el principal menos 0.38" (3/8" or 6 sixteenths)
    let glassWidthAlt = Math.max(0, glassWidth - 6);

    // Apply precise decimal-based workshop math overrides for 3 vias
    if (vias === 3) {
      const totalWidthDecimal = totalWidth / 16;
      // Formula: (Ancho + 0.75) / 3. Truncating to 2 decimal places to get 29.66"
      const leafHorizontalDecimal = Math.floor((totalWidthDecimal + 0.75) / 3 * 100) / 100;
      // First glass = leafHorizontalDecimal - 2.63 = 27.03"
      const glassWidthDecimal = parseFloat((leafHorizontalDecimal - 2.63).toFixed(2));
      // Second glass = glassWidthDecimal - 0.38 = 26.65"
      const glassWidthAltDecimal = parseFloat((glassWidthDecimal - 0.38).toFixed(2));

      // Translate back to the closest 16th values for fractions rendering
      leafHorizontalSize = Math.round(leafHorizontalDecimal * 16);
      glassWidth = Math.round(glassWidthDecimal * 16);
      glassWidthAlt = Math.round(glassWidthAltDecimal * 16);
    }

    return {
      inputs: { w: totalWidth, h: totalHeight, type: windowType, vias },
      marco: [
        {
          id: "side",
          piece: "Laterales",
          qty: 2,
          size: sideRailsSize,
          formula: `Alto - ${formatFraction(frameVertDeduction)}`,
        },
        {
          id: "riel_up_down",
          piece: "Rieles (Arr/Aba)",
          qty: 2,
          size: sillSize,
          formula: `Ancho - ${formatFraction(frameHorizDeduction)}`,
        },
      ],
      hojas: [
        {
          id: "vert",
          piece: "Jamba / Llavín",
          qty: vias * 2,
          size: leafVerticalSize,
          formula: `Alto - ${formatFraction(leafVertDeduction)}`,
        },
        {
          id: "alf_rueda",
          piece: "Alf / Rueda",
          qty: vias * 2,
          size: leafHorizontalSize,
          formula: leafHorizontalFormula,
        },
      ],
      vidrios: (() => {
        const list: CutDetail[] = [];
        if (vias === 3) {
          list.push({
            id: "glass",
            piece: "Cristal Principal",
            qty: 2,
            size: glassWidth,
            dimensions: formatDimensionSet(glassWidth, glassHeight),
            formula: `Alfeizar - 2.63" (Principal)`,
          });
          list.push({
            id: "glass_alt",
            piece: "Cristal (Menos 3/8\" / 0.38\")",
            qty: 1,
            size: glassWidthAlt,
            dimensions: formatDimensionSet(glassWidthAlt, glassHeight),
            formula: `Principal - 0.38"`,
          });
        } else if (vias === 4) {
          list.push({
            id: "glass",
            piece: "Cristal Principal",
            qty: 2,
            size: glassWidth,
            dimensions: formatDimensionSet(glassWidth, glassHeight),
            formula: `Alfeizar - 2.63" (Principal)`,
          });
          list.push({
            id: "glass_alt",
            piece: "Cristal (Menos 3/8\" / 0.38\")",
            qty: 2,
            size: glassWidthAlt,
            dimensions: formatDimensionSet(glassWidthAlt, glassHeight),
            formula: `Principal - 0.38"`,
          });
        } else {
          list.push({
            id: "glass",
            piece: "Cristal Principal",
            qty: vias,
            size: glassWidth,
            dimensions: formatDimensionSet(glassWidth, glassHeight),
            formula: `(Ancho - ${formatFraction(glassWidthFrameDeduction)}) / ${vias} | Alto - ${formatFraction(glassHeightFrameDeduction)}`,
          });
        }
        return list;
      })(),
    };
  }, [widthWhole, widthFrac, heightWhole, heightFrac, vias, windowType]);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
      setTimeout(() => {
        document
          .getElementById("desglose")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }, 600);
  };

  /* addToQueue was redundant, replaced by addToBatch flow */

  const toggleProjectStatus = (id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "pending" ? "completed" : "pending" }
          : p,
      ),
    );
  };

  const toggleCutStatus = (projectId: string, cutId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const alreadyDone = p.completedCuts.includes(cutId);
        const newCompleted = alreadyDone
          ? p.completedCuts.filter((id) => id !== cutId)
          : [...p.completedCuts, cutId];

        const updated = { ...p, completedCuts: newCompleted };
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        return updated;
      }),
    );
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
        setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteId));
        if (selectedProject?.id === pendingDeleteId) {
          setSelectedProject(null);
        }
      } else if (pendingDeleteUnfinishedId) {
        setOrderWindows((prev) => prev.filter((p) => p.id !== pendingDeleteUnfinishedId));
      } else if (pendingDeleteUnfinishedClient) {
        setOrderWindows((prev) => prev.filter((p) => p.clientName !== pendingDeleteUnfinishedClient));
        if (selectedUnfinishedClient === pendingDeleteUnfinishedClient) {
          setSelectedUnfinishedClient(null);
        }
      } else if (pendingDeleteClient) {
        setProjects((prev) =>
          prev.filter((p) => p.clientName !== pendingDeleteClient),
        );
        if (selectedClientName === pendingDeleteClient) {
          setSelectedClientName(null);
        }
      } else if (pendingChangeProfile) {
        setOrderStep(2);
      }
      setIsAuthModalOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteUnfinishedId(null);
      setPendingDeleteUnfinishedClient(null);
      setPendingDeleteClient(null);
      setPendingChangeProfile(false);
      setPassInput("");
    } else {
      setPassInput("");
    }
  };

  const startNewOrder = () => {
    setClientName("");
    setClientPhone("");
    setClientLocation("");
    setAluminioColor("Blanco");
    setDeliveryDate("");
    const defaultTag = windowType === "PUERTA_COMERCIAL" ? "PUERTA 01" : "VENTANA 01";
    setWindowTag(defaultTag);
    setWidthWhole(0);
    setWidthFrac(0);
    setHeightWhole(0);
    setHeightFrac(0);
    setWTopWhole(0);
    setWTopFrac(0);
    setWBottomWhole(0);
    setWBottomFrac(0);
    setHLeftWhole(0);
    setHLeftFrac(0);
    setHRightWhole(0);
    setHRightFrac(0);
    // Removed setOrderWindows([]) - Keep unfinished orders
    setOrderStep(1);
    setActiveView("new-order");
  };

  const saveBatchOrder = () => {
    if (orderWindows.length === 0) return;
    // Only confirm windows for the currently active client name
    const windowsToConfirm = orderWindows.filter(p => p.clientName === clientName);
    if (windowsToConfirm.length === 0) return;

    setProjects((prev) => [...prev, ...windowsToConfirm]);
    setOrderWindows((prev) => prev.filter(p => p.clientName !== clientName));
    setActiveView("dashboard");
    setOrderStep(1);
    setClientName("");
    setClientPhone("");
    setClientLocation("");
    setAluminioColor("Blanco");
    setDeliveryDate("");
  };

  const addToBatch = () => {
    const nextNum = orderWindows.length + 2;
    const prefix = windowType === "PUERTA_COMERCIAL" ? "PUERTA" : "VENTANA";
    const nextTag = `${prefix} ${nextNum.toString().padStart(2, "0")}`;

    const newWindow: WindowProject = {
      id: Math.random().toString(36).substr(2, 9),
      name:
        windowTag ||
        `${prefix} ${(orderWindows.length + 1).toString().padStart(2, "0")}`,
      clientName: clientName || "Cliente Genérico",
      clientPhone: clientPhone,
      clientLocation: clientLocation,
      type: windowType,
      width: widthWhole * 16 + widthFrac,
      height: heightWhole * 16 + heightFrac,
      wTop: wTopWhole * 16 + wTopFrac,
      wBottom: wBottomWhole * 16 + wBottomFrac,
      hLeft: hLeftWhole * 16 + hLeftFrac,
      hRight: hRightWhole * 16 + hRightFrac,
      vias,
      results,
      completedCuts: [],
      status: "pending",
      createdAt: Date.now(),
      deliveryDate: deliveryDate,
      aluminioColor: aluminioColor,
    };
    setOrderWindows((prev) => [...prev, newWindow]);
    setShowResults(false);
    setWindowTag(nextTag);
    setWidthWhole(0);
    setWidthFrac(0);
    setHeightWhole(0);
    setHeightFrac(0);
    setWTopWhole(0);
    setWTopFrac(0);
    setWBottomWhole(0);
    setWBottomFrac(0);
    setHLeftWhole(0);
    setHLeftFrac(0);
    setHRightWhole(0);
    setHRightFrac(0);
  };

  const pendingProjects = projects
    .filter((p) => p.status === "pending")
    .sort((a, b) => {
      const aTotal =
        a.results.marco.length +
        a.results.hojas.length +
        a.results.vidrios.length;
      const aDone = a.completedCuts.length === aTotal;
      const bTotal =
        b.results.marco.length +
        b.results.hojas.length +
        b.results.vidrios.length;
      const bDone = b.completedCuts.length === bTotal;
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  const completedProjects = projects.filter((p) => p.status === "completed");

  const allByClient = useMemo(() => {
    const groups: Record<
      string,
      { pending: WindowProject[]; completed: WindowProject[]; stats: any; count: number; done: number; entryDate: number; exitDate: string | null; hasDoor: boolean }
    > = {};

    projects.forEach((p) => {
      const client = p.clientName || "SIN NOMBRE";
      if (!groups[client]) {
        groups[client] = { pending: [], completed: [], stats: {}, count: 0, done: 0, entryDate: p.createdAt, exitDate: null, hasDoor: false };
      }
      if (p.type === "PUERTA_COMERCIAL") groups[client].hasDoor = true;
      
      groups[client].count++;
      
      const isWindowDone = p.completedCuts.length === (p.results.marco.length + p.results.hojas.length + p.results.vidrios.length);
      if (isWindowDone) groups[client].done++;

      if (p.status === "pending") groups[client].pending.push(p);
      else groups[client].completed.push(p);
    });

    return Object.entries(groups)
      .map(([name, data]) => {
        const clientProjects = [...data.pending, ...data.completed];
        const phone = clientProjects[0]?.clientPhone;
        const location = clientProjects[0]?.clientLocation;
        const entryDate = Math.min(...clientProjects.map((p) => p.createdAt));
        const deliveryDates = clientProjects
          .map((p) => p.deliveryDate)
          .filter(Boolean) as string[];
        const exitDate =
          deliveryDates.length > 0
            ? new Date(
                Math.max(...deliveryDates.map((d) => new Date(d).getTime())),
              ).toISOString()
            : null;

        const totalCuts = clientProjects.reduce(
          (sum, p) =>
            sum +
            p.results.marco.length +
            p.results.hojas.length +
            p.results.vidrios.length,
          0,
        );
        const doneCuts = clientProjects.reduce(
          (sum, p) => sum + p.completedCuts.length,
          0,
        );
        const progress =
          totalCuts > 0 ? Math.round((doneCuts / totalCuts) * 100) : 0;

        return {
          name,
          pending: data.pending.sort((a, b) => a.createdAt - b.createdAt),
          completed: data.completed.sort((a, b) => b.createdAt - a.createdAt),
          phone,
          location,
          entryDate,
          exitDate,
          progress,
          totalWindows: clientProjects.length,
          doneWindows: data.completed.length,
        };
      })
      .sort((a, b) => a.entryDate - b.entryDate);
  }, [projects]);

  const clientsWithProjects = useMemo(() => {
    const clientMap: Record<string, WindowProject[]> = {};
    projects.forEach((p) => {
      const name = p.clientName?.trim() || "COTIZACIÓN";
      if (!clientMap[name]) clientMap[name] = [];
      clientMap[name].push(p);
    });
    return Object.entries(clientMap).map(([name, clientProjects]) => {
      let totalRealSqFt = 0;
      let totalAdjustedSqFt = 0;
      let totalGlassSqFt = 0;
      let completedCutsCount = 0;
      let totalCutsCount = 0;
      
      clientProjects.forEach((p) => {
        const areaSqFt = ((p.width / 16) * (p.height / 16)) / 144;
        const adjustedArea = (p.width === 0 || p.height === 0) ? 0 : Math.max(14, areaSqFt);
        const qty = p.qty || 1;
        totalRealSqFt += areaSqFt * qty;
        totalAdjustedSqFt += adjustedArea * qty;

        // Parse glass
        if (p.results?.vidrios) {
          p.results.vidrios.forEach((vidrio) => {
            if (vidrio.dimensions) {
              const [wStr, hStr] = vidrio.dimensions.split(" x ");
              const wInches = parseFractionInches(wStr);
              const hInches = parseFractionInches(hStr);
              totalGlassSqFt += (wInches * hInches) / 144 * (vidrio.qty || 1) * qty;
            }
          });
        }

        const windowCuts = (p.results?.marco?.length || 0) + (p.results?.hojas?.length || 0) + (p.results?.vidrios?.length || 0);
        totalCutsCount += windowCuts;
        completedCutsCount += p.completedCuts?.length || 0;
      });

      const progressPct = totalCutsCount > 0 ? Math.round((completedCutsCount / totalCutsCount) * 100) : 0;

      return {
        name,
        projectsCount: clientProjects.length,
        realSqFt: totalRealSqFt,
        adjustedSqFt: totalAdjustedSqFt,
        glassSqFt: totalGlassSqFt,
        progress: progressPct,
        rawProjects: clientProjects
      };
    }).sort((a, b) => b.projectsCount - a.projectsCount);
  }, [projects]);

  const currentDetailClient = useMemo(() => {
    return clientsWithProjects.find((c) => c.name === selectedDetailClient);
  }, [clientsWithProjects, selectedDetailClient]);

  const clientPiecesByName = useMemo(() => {
    const piecesByName: Record<string, { size: number; qty: number }[]> = {};
    if (currentDetailClient) {
      currentDetailClient.rawProjects.forEach((p) => {
        if (!p.width || !p.height) return;
        [...p.results.marco, ...p.results.hojas].forEach((item) => {
          if (!piecesByName[item.piece]) piecesByName[item.piece] = [];
          piecesByName[item.piece].push({ size: item.size, qty: item.qty * (p.qty || 1) });
        });
      });
    }
    return piecesByName;
  }, [currentDetailClient]);

  const clientBarsSummary = useMemo(() => {
    return Object.entries(clientPiecesByName).map(([name, pieces], index) => {
      const typedPieces = pieces as { size: number; qty: number }[];
      
      const sizeGroups: Record<number, number> = {};
      typedPieces.forEach((p) => {
        sizeGroups[p.size] = (sizeGroups[p.size] || 0) + p.qty;
      });

      let totalBars = 0;
      Object.entries(sizeGroups).forEach(([sizeStr, qty]) => {
        const sizeVal = parseFloat(sizeStr);
        const sizeInches = sizeVal / 16;
        const piecesPerBar = Math.floor(250 / sizeInches);
        if (piecesPerBar <= 0) {
          totalBars += qty;
        } else {
          totalBars += Math.ceil(qty / piecesPerBar);
        }
      });

      const totalPiecesCount = typedPieces.reduce((sum, p) => sum + p.qty, 0);

      return {
        index: index + 1,
        name,
        barsCount: totalBars,
        piecesCount: totalPiecesCount,
      };
    });
  }, [clientPiecesByName]);

  const clientGlassSummary = useMemo(() => {
    if (!currentDetailClient) return [];
    const glassMap: Record<string, { qty: number; area: number; dimensions: string }> = {};
    currentDetailClient.rawProjects.forEach((p) => {
      if (p.results?.vidrios) {
        p.results.vidrios.forEach((vidrio) => {
          if (vidrio.dimensions) {
            const key = vidrio.dimensions;
            const [wStr, hStr] = key.split(" x ");
            const wInches = parseFractionInches(wStr);
            const hInches = parseFractionInches(hStr);
            const singleGlassArea = (wInches * hInches) / 144;
            const totalQty = (vidrio.qty || 1) * (p.qty || 1);

            if (!glassMap[key]) {
              glassMap[key] = {
                qty: 0,
                area: 0,
                dimensions: key,
              };
            }
            glassMap[key].qty += totalQty;
            glassMap[key].area += singleGlassArea * totalQty;
          }
        });
      }
    });
    return Object.values(glassMap);
  }, [currentDetailClient]);

  const clientAccessories = useMemo(() => {
    if (!currentDetailClient) return [];
    let totalWindowsCount = 0;
    currentDetailClient.rawProjects.forEach((p) => {
      totalWindowsCount += (p.qty || 1);
    });
    return [
      { name: "Ruedas de Ventana", qty: totalWindowsCount * 2, unit: "Unidades" },
      { name: "Kit de Guías / Plásticos", qty: totalWindowsCount, unit: "Kit" },
      { name: "Puñito", qty: totalWindowsCount, unit: "Unidades" },
    ];
  }, [currentDetailClient]);

  const consolidatedMaterials = useMemo(() => {
    if (!currentDetailClient) return { profiles: [], accessories: [] };

    const profileCutsGroup: Record<string, { cuts: number[]; color: string; rawName: string }> = {};

    currentDetailClient.rawProjects.forEach((p) => {
      if (!p.width || !p.height) return;
      const windowQty = p.qty || 1;
      const color = p.aluminioColor || "Blanco";

      if (p.type === "P65" || p.type === "P92") {
        const lateralDetail = p.results.marco.find((item) => item.id === "side");
        const rielDetail = p.results.marco.find((item) => item.id === "riel_up_down");
        const verticalDetail = p.results.hojas.find((item) => item.id === "vert");
        const horizontalDetail = p.results.hojas.find((item) => item.id === "alf_rueda");

        const vias = p.vias || 2;

        // 1. Laterales
        if (lateralDetail) {
          const key = `lateral-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "lateral" };
          const times = 2 * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(lateralDetail.size);
          }
        }

        // 2. Cabezal
        if (rielDetail) {
          const key = `cabezal-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "cabezal" };
          const times = 1 * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(rielDetail.size);
          }
        }

        // 3. Riel
        if (rielDetail) {
          const key = `riel-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "riel" };
          const times = 1 * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(rielDetail.size);
          }
        }

        // 4. Llavín
        if (verticalDetail) {
          const key = `llavín-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "llavín" };
          const times = vias * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(verticalDetail.size);
          }
        }

        // 5. Enganche
        if (verticalDetail) {
          const key = `enganche-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "enganche" };
          const times = vias * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(verticalDetail.size);
          }
        }

        // 6. Zócalo
        if (horizontalDetail) {
          const key = `zócalo-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: "zócalo" };
          const times = (vias * 2) * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(horizontalDetail.size);
          }
        }
      } else {
        // Fallback for non-sliding parts
        [...p.results.marco, ...p.results.hojas].forEach((item) => {
          const key = `${item.piece.toLowerCase()}-${color}`;
          if (!profileCutsGroup[key]) profileCutsGroup[key] = { cuts: [], color, rawName: item.piece.toLowerCase() };
          const times = item.qty * windowQty;
          for (let i = 0; i < times; i++) {
            profileCutsGroup[key].cuts.push(item.size);
          }
        });
      }
    });

    const consolidatedProfiles = Object.values(profileCutsGroup).map((group) => {
      // Group group.cuts by their exact size in sixteenths
      const sizeGroups: Record<number, number> = {};
      group.cuts.forEach((cutSize) => {
        sizeGroups[cutSize] = (sizeGroups[cutSize] || 0) + 1;
      });

      let totalBars = 0;
      Object.entries(sizeGroups).forEach(([sizeStr, qty]) => {
        const sizeVal = parseFloat(sizeStr);
        const sizeInches = sizeVal / 16;
        const piecesPerBar = Math.floor(250 / sizeInches);
        if (piecesPerBar <= 0) {
          totalBars += qty;
        } else {
          totalBars += Math.ceil(qty / piecesPerBar);
        }
      });

      return {
        name: group.rawName,
        color: group.color,
        cutsCount: group.cuts.length,
        barsNeeded: totalBars,
      };
    }).filter((p) => p.barsNeeded > 0);

    let totalWindowsCount = 0;
    let totalViasCount = 0;
    currentDetailClient.rawProjects.forEach((p) => {
      const windowQty = p.qty || 1;
      totalWindowsCount += windowQty;
      totalViasCount += (p.vias || 2) * windowQty;
    });

    const consolidatedAccessories = [
      { name: "Ruedas de Ventana", qty: totalViasCount * 2, unit: "unidades" },
      { name: "Kit de Guías / Plásticos", qty: totalWindowsCount, unit: "kit" },
      { name: "Cierre de Centro (Llavín manual)", qty: totalWindowsCount, unit: "unidades" },
    ];

    return {
      profiles: consolidatedProfiles,
      accessories: consolidatedAccessories,
    };
  }, [currentDetailClient]);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent/30 selection:text-white overflow-x-hidden uppercase-none print:bg-white print:text-black">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 print:hidden !print:opacity-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900 rounded-full blur-[100px]" />
      </div>

      {/* Futuristic Scanline */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden print:hidden !print:opacity-0">
        <div className="w-full h-[2px] bg-white animate-[scan_8s_linear_infinite]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-bg/80 border-b border-brand-border p-4 lg:px-10 flex justify-between items-center shrink-0 print:hidden">
        <div className="flex items-center gap-4">
          <motion.div
            onClick={() => setActiveView("dashboard")}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-1 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-all shadow-2xl">
              <BrandLogo className="w-10 h-10 sm:w-12 sm:h-12" />
            </div>
            <BrandingText />
          </motion.div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button
               onClick={exportData}
               title="Exportar Datos (Descargar)"
               className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Exportar</span>
            </button>
            
            <label className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-2 cursor-pointer">
              <Upload size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Importar</span>
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>

            <button
               onClick={handleShareEmail}
               title="Compartir por Correo"
               className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 hover:bg-amber-500/20 transition-all"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Mobile compact icons */}
          <div className="sm:hidden flex items-center gap-1 mr-2">
             <button onClick={exportData} title="Exportar" className="p-2 text-emerald-400"><Download size={18}/></button>
             <label className="p-2 text-blue-400 cursor-pointer">
                <Upload size={18}/>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
             </label>
             <button onClick={handleShareEmail} title="Compartir" className="p-2 text-amber-400"><Share2 size={18}/></button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-10 sm:space-y-16">
          {activeView === "new-order" ? (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8 sm:space-y-12"
            >
              {/* Order Flow Header */}
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={() => setActiveView("dashboard")}
                  className="flex items-center gap-2 text-[9px] font-black text-brand-muted uppercase tracking-[0.2em] hover:text-white transition-all"
                >
                  <ArrowLeft size={14} /> Volver
                </button>
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((step) => (
                    <div key={step}>
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${orderStep === step ? "bg-brand-accent border-brand-accent text-white shadow-lg scale-105" : "bg-white/5 border-white/10 text-brand-muted"}`}
                      >
                        {step}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {orderStep === 1 ? (
                <>
                  <section className="bg-brand-sidebar border border-brand-border p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -mr-4 -mt-4">
                      <User size={80} />
                    </div>
                    <div className="space-y-1 relative z-10">
                      <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">
                        Nuevo Cliente
                      </h2>
                      <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">
                        Datos de la orden técnica
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                          Cliente / Proyecto
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Nombre o Ref. de obra"
                          className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg placeholder:text-brand-muted/10 focus:outline-none focus:border-brand-accent transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                          Fecha Estimada
                        </label>
                        <input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg focus:outline-none focus:border-brand-accent transition-all shadow-inner color-scheme-dark"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                          Teléfono
                        </label>
                        <input
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Número de contacto"
                          className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg placeholder:text-brand-muted/10 focus:outline-none focus:border-brand-accent transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={clientLocation}
                          onChange={(e) => setClientLocation(e.target.value)}
                          placeholder="Dirección o Ciudad"
                          className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-base sm:text-lg placeholder:text-brand-muted/10 focus:outline-none focus:border-brand-accent transition-all shadow-inner"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                          Color Perfil / Aluminio
                        </label>
                        <select
                          value={aluminioColor}
                          onChange={(e) => setAluminioColor(e.target.value)}
                          className="w-full h-12 sm:h-14 bg-brand-bg border border-brand-border px-5 rounded-[1rem] sm:rounded-[1.2rem] text-white font-black text-xs sm:text-sm focus:outline-none focus:border-brand-accent transition-all shadow-inner cursor-pointer"
                        >
                          <option value="Blanco" className="bg-brand-sidebar text-white font-semibold">Blanco</option>
                          <option value="Bronce" className="bg-brand-sidebar text-white font-semibold">Bronce</option>
                          <option value="Gris" className="bg-brand-sidebar text-white font-semibold">Gris</option>
                          <option value="Negro" className="bg-brand-sidebar text-white font-semibold">Negro</option>
                          <option value="Hueso" className="bg-brand-sidebar text-white font-semibold">Hueso</option>
                        </select>
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
                      <h3 className="text-[10px] font-black text-brand-muted uppercase tracking-[0.3em] px-1 opacity-50">
                        Clientes Existentes
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                        {allByClient.map((client) => (
                          <div
                            key={client.name}
                            className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group hover:border-brand-accent/30 transition-all"
                          >
                            <div className="overflow-hidden">
                              <p className="text-sm font-black text-white italic truncate leading-none mb-1">
                                {client.name}
                              </p>
                              <p className="text-[9px] text-brand-muted uppercase font-mono">
                                {client.totalWindows} Ventanas
                              </p>
                              {(client.phone || client.location) && (
                                <p className="text-[8px] text-brand-accent/50 uppercase mt-1 truncate">
                                  {client.phone} {client.phone && client.location && "•"} {client.location}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => deleteClientGroup(client.name)}
                                className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setClientName(client.name);
                                  setClientPhone(client.phone || "");
                                  setClientLocation(client.location || "");
                                  setOrderStep(2);
                                }}
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
                      <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">
                        Tipo de fabricacion
                      </h2>
                      <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">
                        Seleccione el perfil de fabricación
                      </p>
                    </div>
                    <button
                      onClick={() => setOrderStep(1)}
                      className="p-2 bg-white/5 rounded-lg text-brand-muted hover:text-white transition-all"
                    >
                      <ArrowLeft size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        { id: "P65", desc: "Series 65 Premium" },
                        { id: "P92", desc: "Industrial Heavy" },
                        { id: "VENTILADA", desc: "Flujo de Aire" },
                        { id: "GAVETAS", desc: "Sistema de Gavetas" },
                        { id: "PUERTA_COMERCIAL", desc: "Perfil de Alto Tráfico" },
                        { id: "COCINA_MODULAR", desc: "Muebles de Cocina" },
                      ] as const
                    ).map((type) => (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (type.id === "COCINA_MODULAR") {
                            window.open("https://cocina-dusky.vercel.app/", "_blank");
                            return;
                          }
                          setWindowType(type.id);
                          if (type.id === "PUERTA_COMERCIAL") {
                            setVias(1);
                            setWindowTag("PUERTA 01");
                          } else {
                            setVias(2);
                            setWindowTag("VENTANA 01");
                          }
                          setOrderStep(3);
                          setShowResults(true);
                        }}
                        className={`p-6 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group ${windowType === type.id ? "bg-brand-accent/10 border-brand-accent shadow-[0_0_25px_rgba(59,130,246,0.15)]" : "bg-brand-bg border-brand-border hover:border-brand-accent/40"}`}
                      >
                        <div className="relative z-10">
                          <h3
                            className={`text-xl font-black italic mb-1 ${windowType === type.id ? "text-brand-accent" : "text-white"}`}
                          >
                            {type.id === "PUERTA_COMERCIAL" ? "COMERCIAL" : type.id.replace("_", " ")}
                          </h3>
                          <p
                            className={`text-[9px] font-bold uppercase tracking-widest ${windowType === type.id ? "text-brand-accent/80" : "text-brand-muted group-hover:text-white/60"}`}
                          >
                            {type.desc}
                          </p>
                        </div>
                        <div
                          className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${windowType === type.id ? "opacity-10 text-brand-accent" : "text-white"}`}
                        >
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
                      <p className="text-[8px] text-brand-muted font-black uppercase tracking-widest leading-tight">
                        Configurando para:
                      </p>
                      <p className="text-xs font-black text-white uppercase italic truncate">
                        {clientName}
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <>
                  <div className="space-y-6">
                    {/* Step 3: Add Windows to this Client */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-brand-accent/10 border border-brand-accent/20 p-4 rounded-[1.5rem] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white shrink-0">
                            <User size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-black text-white uppercase italic truncate">
                              {clientName}
                            </h4>
                            <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest opacity-60">
                              Cliente
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setOrderStep(1)}
                          className="p-2 hover:bg-white/5 rounded-lg text-brand-muted transition-all"
                        >
                          <ArrowLeft size={14} />
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 p-4 rounded-[1.5rem] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-sidebar border border-white/5 flex items-center justify-center text-brand-accent shrink-0">
                            <Calculator size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-black text-white uppercase italic truncate">
                              {windowType === "PUERTA_COMERCIAL" ? "COMERCIAL" : windowType.replace("_", " ")}
                            </h4>
                            <p className="text-[8px] text-brand-muted uppercase font-mono tracking-widest opacity-60">
                              Perfil Seleccionado
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={requestProfileChange}
                          className="p-2 hover:bg-white/5 rounded-lg text-brand-muted transition-all"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Calculator Console */}
                  <section className="bg-brand-sidebar border border-brand-border p-5 sm:p-2 rounded-[2rem] sm:rounded-[3rem] shadow-2xl space-y-6 sm:space-y-8 overflow-hidden">
                    <div className="p-1">
                      <WindowPreview
                        width={widthWhole * 16 + widthFrac}
                        height={heightWhole * 16 + heightFrac}
                        wTop={wTopWhole * 16 + wTopFrac}
                        wBottom={wBottomWhole * 16 + wBottomFrac}
                        hLeft={hLeftWhole * 16 + hLeftFrac}
                        hRight={hRightWhole * 16 + hRightFrac}
                        vias={vias}
                        large={true}
                        windowType={windowType}
                      />
                    </div>

                    {windowType !== "COCINA_MODULAR" && (
                    <div className="p-6 sm:p-8 pt-0 space-y-6 sm:space-y-8">
                      <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="w-12 h-1 bg-brand-accent rounded-full animate-pulse" />
                          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">
                            Consola Técnica
                          </h2>
                        </div>
                        <div className="px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-lg">
                          <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest">
                            {windowType === "PUERTA_COMERCIAL" ? "COMERCIAL" : windowType.replace("_", " ")} EUROPEO
                          </p>
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
                          <>
                            <DimensionInput
                              label="Ancho"
                              whole={widthWhole}
                              fraction={widthFrac}
                              onWholeChange={setWidthWhole}
                              onFractionChange={setWidthFrac}
                            />
                            <DimensionInput
                              label="Alto"
                              whole={heightWhole}
                              fraction={heightFrac}
                              onWholeChange={setHeightWhole}
                              onFractionChange={setHeightFrac}
                            />
                          </>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[8px] font-black text-brand-accent uppercase tracking-widest pl-1">
                             {windowType === "GAVETAS" 
                               ? "Cantidad de Gavetas" 
                               : windowType === "PUERTA_COMERCIAL" 
                                 ? "Cantidad de Hojas" 
                                 : windowType === "COCINA_MODULAR"
                                   ? "Cantidad de Puertas"
                                   : "Configuración de Hojas (Vías)"}
                           </label>
                           <div className={`grid ${windowType === "PUERTA_COMERCIAL" ? "grid-cols-2" : windowType === "COCINA_MODULAR" ? "grid-cols-3" : "grid-cols-3"} gap-3`}>
                             {(windowType === "PUERTA_COMERCIAL" ? [1, 2] : windowType === "COCINA_MODULAR" ? [1, 2, 3, 4, 5, 6] : [2, 3, 4]).map((v) => (
                               <button
                                 key={v}
                                 onClick={() => setVias(v as any)}
                                 className={`group relative ${windowType === "PUERTA_COMERCIAL" || windowType === "COCINA_MODULAR" ? "h-40" : "h-32"} rounded-2xl border-2 transition-all flex flex-col items-center justify-between p-3 ${vias === v ? "bg-brand-accent/10 border-brand-accent shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "bg-brand-bg border-brand-border text-brand-muted hover:border-brand-accent/50"}`}
                               >
                                 <div className="w-full pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity flex-1 flex items-center justify-center">
                                   <WindowPreview
                                     width={
                                       v === 1 ? 40 * 16 : v === 2 ? 80 * 16 : v === 3 ? 90 * 16 : v === 4 ? 120 * 16 : v === 5 ? 140 * 16 : 160 * 16
                                     }
                                     height={v === 1 || (v === 2 && windowType === "PUERTA_COMERCIAL") ? 84 * 16 : 60 * 16}
                                     vias={v as any}
                                     windowType={windowType}
                                   />
                                 </div>
                                 <span
                                   className={`text-[9px] font-black uppercase tracking-widest transition-colors mt-2 ${vias === v ? "text-brand-accent" : "text-brand-muted group-hover:text-white"}`}
                                 >
                                   {v} {windowType === "GAVETAS" ? "Gavetas" : windowType === "COCINA_MODULAR" ? (v === 1 ? "Puerta" : "Puertas") : v === 1 ? "Hoja" : "Hojas"}
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
                          onClick={addToBatch}
                          className="w-full h-16 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-xs shadow-xl transition-all mt-8"
                        >
                          <Plus size={20} strokeWidth={3} /> Añadir al Pedido
                        </button>
                      </div>

                      <div className="space-y-6 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-3 px-1">
                          <ClipboardList className="text-brand-accent" size={20} />
                          <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">
                            Cortes Calculados
                          </h3>
                        </div>
                        <ResultsBreakdown 
                          results={results} 
                          windowType={windowType}
                        />
                      </div>
                    </div>
                    )}
                  </section>

                  {/* Batch Summary */}
                  {orderWindows.length > 0 && (
                    <div className="space-y-6 pt-12">
                      <div className="flex items-center px-4">
                        <h5 className="text-xs font-black text-brand-muted uppercase tracking-[0.4em]">
                          Resumen de Carga ({orderWindows.filter(p => p.clientName === clientName).length})
                        </h5>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {orderWindows.filter(p => p.clientName === clientName).map((p) => (
                          <div
                            key={p.id}
                            className="p-5 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 scale-50">
                                <WindowPreview
                                  width={p.width}
                                  height={p.height}
                                  wTop={p.wTop}
                                  wBottom={p.wBottom}
                                  hLeft={p.hLeft}
                                  hRight={p.hRight}
                                  vias={p.vias}
                                  windowType={p.type}
                                />
                              </div>
                              <div>
                                <p className="text-sm font-black text-white uppercase italic">
                                  {p.type === "PUERTA_COMERCIAL" ? p.name : `${p.name} (${p.vias} Vías - ${p.type})`}
                                </p>
                                <p className="text-[10px] font-mono text-brand-muted">
                                  {formatFraction(p.width)} x{" "}
                                  {formatFraction(p.height)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setOrderWindows((prev) =>
                                  prev.filter((w) => w.id !== p.id),
                                )
                              }
                              className="text-red-500/40 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-4 px-4 pb-12 space-y-6">
                        <button
                          onClick={saveBatchOrder}
                          className="w-full py-6 bg-emerald-500 rounded-3xl text-white font-black uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all scale-100 active:scale-[0.98]"
                        >
                          <Save size={20} /> Guardar y Confirmar Pedido Completo
                        </button>

                        {/* SQFT Calculator */}
                        <div className="bg-brand-sidebar/60 border border-brand-border/50 rounded-[2.5rem] p-6 space-y-4 shadow-xl backdrop-blur-sm">
                            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted opacity-50">Cálculo de Cotización (Pie²)</h4>
                                <div className="px-2 py-1 bg-brand-accent/20 rounded text-[8px] font-black text-brand-accent uppercase">Automático</div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-muted opacity-40">Total Pie²</span>
                                    <div className="text-3xl font-mono font-black text-white italic">
                                        {orderWindows.filter(p => p.clientName === clientName).reduce((acc, p) => {
                                            const areaSqFt = ((p.width / 16) * (p.height / 16)) / 144;
                                            const adjustedArea = (p.width === 0 || p.height === 0) ? 0 : Math.max(14, areaSqFt);
                                            return acc + (adjustedArea * (p.qty || 1));
                                        }, 0).toFixed(2)}
                                    </div>
                                    <p className="text-[6px] text-brand-accent font-black uppercase opacity-60">Mínimo 14ft² p/ ventana</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-muted opacity-40">Venta / Pie²</span>
                                    <div className="flex items-center gap-1.5 border-b border-brand-accent/30 pb-0.5">
                                        <span className="text-xs font-black text-brand-accent">$</span>
                                        <input 
                                            type="number"
                                            value={clientPricing[clientName] || ""}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              setClientPricing(prev => {
                                                const next = { ...prev, [clientName]: val };
                                                localStorage.setItem("v-cut-pricing", JSON.stringify(next));
                                                return next;
                                              });
                                            }}
                                            placeholder="0.00"
                                            className="w-full bg-transparent text-white font-mono font-black text-lg focus:outline-none placeholder:text-white/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 mt-2 border-t border-brand-accent/10">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Total Venta Estimada</span>
                                        <span className="text-[7px] text-brand-muted italic opacity-40 lowercase">Ajustado a mínimo 14'</span>
                                    </div>
                                    <div className="text-4xl font-mono font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                                        ${(orderWindows.reduce((acc, p) => {
                                            const areaSqFt = ((p.width / 16) * (p.height / 16)) / 144;
                                            const adjustedArea = (p.width === 0 || p.height === 0) ? 0 : Math.max(14, areaSqFt);
                                            return acc + (adjustedArea * (p.qty || 1));
                                        }, 0) * (clientPricing[clientName] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <PurchaseDetail
                          projects={orderWindows}
                          linearPrice={linearPrice}
                          setLinearPrice={setLinearPrice}
                          barLength={barLength}
                          setBarLength={setBarLength}
                        />
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
              {!selectedClientName && activeView === "dashboard" && (
                <ClientDashboard
                  projects={projects.filter((p) => p.status === "pending")}
                  onClientClick={(name) => setSelectedClientName(name)}
                  selectedClientName={selectedClientName}
                  title="Panel de Control"
                  subtitle="Producción Activa"
                />
              )}

              {!selectedClientName && activeView === "history" && (
                <ClientDashboard
                  projects={projects.filter((p) => p.status === "completed")}
                  onClientClick={(name) => setSelectedClientName(name)}
                  selectedClientName={selectedClientName}
                  title="Historial"
                  subtitle="Ordenes Finalizadas"
                />
              )}

              {!selectedClientName && activeView === "unfinished" && (
                <section className="space-y-6">
                  <div className="flex flex-col gap-1 px-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
                      Ordenes sin Terminar
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-amber-500 rounded-full" />
                      <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">
                        Selecciona un cliente para continuar
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(groupedUnfinished).length > 0 ? (
                      Object.entries(groupedUnfinished).map(([name, windows]) => {
                        const winList = windows as WindowProject[];
                        return (
                        <motion.div
                          layout
                          key={name}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileTap={{ scale: 0.98 }}
                          className="relative overflow-hidden group rounded-[2.5rem] bg-brand-sidebar/40 border border-white/5 hover:border-amber-500/30 transition-all cursor-pointer shadow-2xl backdrop-blur-xl"
                          onClick={() => {
                            // Automatically resume this client's order
                            setClientName(name);
                            const firstWin = winList[0];
                            if (firstWin) {
                              setClientPhone(firstWin.clientPhone || "");
                              setClientLocation(firstWin.clientLocation || "");
                            }
                            setOrderStep(3);
                            setActiveView("new-order");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <div className="p-6 pb-20">
                            <div className="flex justify-between items-start mb-4">
                               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                  <Clock size={24} />
                               </div>
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDeleteUnfinishedClient(name);
                                    setIsAuthModalOpen(true);
                                    setPassInput("");
                                  }}
                                  className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                            <h3 className="text-xl font-black text-white italic truncate uppercase tracking-tight">
                              {name}
                            </h3>
                            <p className="text-[9px] text-brand-muted font-black uppercase tracking-widest opacity-60 mt-1">
                              {winList.length} {winList.length === 1 ? "Ventana" : "Ventanas"} Pendientes
                            </p>
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-amber-500/10 border-t border-white/5 flex justify-between items-center transition-colors group-hover:bg-amber-500/20">
                             <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Continuar Pedido</span>
                             <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </motion.div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-20 text-center opacity-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                        <RotateCcw size={40} className="mx-auto mb-4 text-brand-muted" />
                        <p className="text-xs font-black uppercase tracking-[0.5em]">No hay ordenes pendientes</p>
                      </div>
                    )}
                  </div>
                </section>
              )}


              {!selectedClientName && activeView === "detail" && (
                <section className="space-y-8">
                  {/* Head Title */}
                  <div className="flex flex-col gap-1 px-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase leading-tight flex items-center gap-2">
                      <ClipboardList className="text-brand-accent shrink-0" size={24} /> 
                      {selectedDetailClient ? `Detalle: ${selectedDetailClient}` : "Desglose por Cliente"}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-brand-accent rounded-full" />
                      <p className="text-[8px] text-brand-muted uppercase tracking-[0.3em] font-medium opacity-60">
                        {selectedDetailClient 
                          ? "Cálculos de pies cuadrados, optimización de materiales y cristales"
                          : "Selecciona un cliente para ver su inventario de cortes, materiales y pies cuadrados"
                        }
                      </p>
                    </div>
                  </div>

                  {!selectedDetailClient ? (
                    /* CLIENT LISTS WITH SUMS */
                    clientsWithProjects.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clientsWithProjects.map((client) => (
                          <motion.div
                            key={client.name}
                            onClick={() => {
                              setSelectedDetailClient(client.name);
                              setExpandedWindowId(null);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            whileHover={{ y: -4, scale: 1.01 }}
                            className="bg-brand-sidebar border border-brand-border hover:border-brand-accent/40 rounded-[2.5rem] p-6 cursor-pointer shadow-xl transition-all group flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className="px-3.5 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[9px] font-black text-brand-accent uppercase tracking-widest leading-none">
                                  {client.projectsCount} {client.projectsCount === 1 ? "Ventana" : "Ventanas"}
                                </span>
                                <div className="text-[10px] font-mono text-brand-accent group-hover:underline flex items-center gap-1 font-bold">
                                  VER DETALLES <ArrowRight size={12} />
                                </div>
                              </div>
                              <h3 className="text-xl font-black text-white uppercase italic tracking-tight font-sans leading-none mb-4 truncate group-hover:text-brand-accent transition-colors">
                                {client.name}
                              </h3>

                              <div className="space-y-2 border-t border-white/5 pt-3 text-xs mb-4">
                                <div className="flex justify-between">
                                  <span className="text-brand-muted font-bold">Cobrado (Mín. 14'):</span>
                                  <span className="text-emerald-400 font-mono font-bold">{client.adjustedSqFt.toFixed(2)} Pie²</span>
                                </div>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1 mt-auto">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-brand-muted opacity-60">
                                <span>Avance General</span>
                                <span>{client.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-accent"
                                  style={{ width: `${client.progress}%` }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center opacity-40 border border-dashed border-white/10 rounded-[2.5rem] bg-brand-sidebar/40">
                        <ClipboardList className="mx-auto mb-4 text-brand-muted" size={40} />
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-white">No hay clientes con órdenes creadas</p>
                        <p className="text-[10px] text-brand-muted mt-2">Crea una orden desde la pestaña "Nuevo" para ver el detalle de cálculos.</p>
                      </div>
                    )
                  ) : (
                    /* CLIENT CHOSEN PANEL DETAILS */
                    currentDetailClient ? (
                      <div className="space-y-6">
                        {/* Subheader Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-brand-sidebar border border-brand-border rounded-[2rem] gap-4 shadow-xl">
                          <button
                            onClick={() => setSelectedDetailClient(null)}
                            className="flex items-center gap-2 text-xs font-black text-brand-muted hover:text-white uppercase tracking-widest border border-white/10 hover:border-white/20 px-4 py-2 bg-white/5 rounded-xl transition-all"
                          >
                            <ArrowLeft size={14} /> Volver a Clientes
                          </button>

                          <div className="flex flex-wrap gap-4 text-xs font-bold leading-none shrink-0 w-full sm:w-auto">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex-1 sm:flex-initial text-center min-w-[100px]">
                              <span className="block text-[8px] font-black uppercase tracking-wider text-brand-muted opacity-50 mb-1">Ventanas</span>
                              <span className="text-lg font-black text-white">{currentDetailClient.projectsCount}</span>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex-1 sm:flex-initial text-center min-w-[120px]">
                              <span className="block text-[8px] font-black uppercase tracking-wider text-brand-muted opacity-50 mb-1">Mín. Ajustado</span>
                              <span className="text-lg font-black text-emerald-400 font-mono">{currentDetailClient.adjustedSqFt.toFixed(1)} <sub className="text-[10px] lowercase">ft²</sub></span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive columns: left = Window accordion list, right = optimized materials */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          
                          {/* Left: Window Breakdown */}
                          <div className="lg:col-span-7 space-y-4">
                            <div className="flex flex-col gap-1 mb-2 px-1">
                              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <ClipboardList size={16} className="text-brand-accent" /> Desglose por Ventana ({currentDetailClient.projectsCount})
                              </h3>
                              <p className="text-[9px] text-brand-muted uppercase tracking-widest opacity-60">
                                Expande cada ventana para ver su desglose de cortes específico
                              </p>
                            </div>

                            <div className="space-y-3">
                              {currentDetailClient.rawProjects.map((p) => {
                                const isExpanded = expandedWindowId === p.id;
                                const areaSqFt = ((p.width / 16) * (p.height / 16)) / 144;
                                const adjustedArea = (p.width === 0 || p.height === 0) ? 0 : Math.max(14, areaSqFt);

                                return (
                                  <div 
                                    key={p.id}
                                    className="bg-brand-sidebar border border-brand-border rounded-[2rem] overflow-hidden transition-all duration-300 shadow-lg"
                                  >
                                    <div 
                                      onClick={() => setExpandedWindowId(isExpanded ? null : p.id)}
                                      className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    >
                                      <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-12 h-12 shrink-0 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center p-1.5 overflow-hidden">
                                          <div className="scale-60 transform origin-center">
                                            <WindowPreview
                                              width={p.width}
                                              height={p.height}
                                              vias={p.vias}
                                              windowType={p.type}
                                              wTop={p.wTop}
                                              wBottom={p.wBottom}
                                              hLeft={p.hLeft}
                                              hRight={p.hRight}
                                            />
                                          </div>
                                        </div>
                                        <div className="overflow-hidden">
                                          <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[160px] sm:max-w-xs">{p.name}</h4>
                                            {p.qty && p.qty > 1 && (
                                              <span className="px-2 py-0.5 bg-brand-accent/20 border border-brand-accent/30 rounded text-[9px] font-black text-brand-accent">
                                                x{p.qty}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-brand-muted font-mono mt-0.5">
                                            {formatFraction(p.width)}" x {formatFraction(p.height)}" • Vías: {p.vias}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-right hidden sm:block">
                                          <div className="text-xs font-mono font-black text-white">{adjustedArea.toFixed(2)} Pie² <sub className="text-[8px] text-brand-muted font-medium font-sans">min 14</sub></div>
                                          <span className="text-[8px] font-black uppercase text-brand-accent/80 tracking-widest">{p.type}</span>
                                        </div>
                                        <div className="text-white/40 hover:text-white p-1">
                                          {isExpanded ? <ChevronDown size={20} className="rotate-180 transition-transform duration-300" /> : <ChevronDown size={20} className="transition-transform duration-300" />}
                                        </div>
                                      </div>
                                    </div>

                                    <AnimatePresence>
                                      {isExpanded && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.3 }}
                                          className="border-t border-white/5 bg-black/25 overflow-hidden"
                                        >
                                          <div className="p-6 space-y-4">
                                            {/* Extra individual area info for windows and glass */}
                                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold font-mono">
                                              <div>
                                                <span className="block text-[8px] font-black uppercase text-brand-muted tracking-wider mb-0.5">Medida</span>
                                                <span className="text-white font-black">{formatFraction(p.width)}" x {formatFraction(p.height)}"</span>
                                              </div>
                                              <div>
                                                <span className="block text-[8px] font-black uppercase text-brand-muted tracking-wider mb-0.5">Pies² Reales</span>
                                                <span className="text-white">{areaSqFt.toFixed(2)} Pie²</span>
                                              </div>
                                              <div>
                                                <span className="block text-[8px] font-black uppercase text-blue-400 tracking-wider mb-0.5">Vidrio</span>
                                                <span className="text-blue-400">
                                                  {(() => {
                                                    let totalGlass = 0;
                                                    p.results.vidrios.forEach((vidrio) => {
                                                      if (vidrio.dimensions) {
                                                        const [wStr, hStr] = vidrio.dimensions.split(" x ");
                                                        totalGlass += (parseFractionInches(wStr) * parseFractionInches(hStr)) / 144 * (vidrio.qty || 1);
                                                      }
                                                    });
                                                    return totalGlass.toFixed(2);
                                                  })()}{" "}
                                                  Pie²
                                                </span>
                                              </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-4">
                                              <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.3em] mb-3">Plan de Cortes y Avances</p>
                                              <ResultsBreakdown 
                                                results={p.results} 
                                                windowType={p.type}
                                                completedCuts={p.completedCuts}
                                                onToggleCut={(cutId) => toggleCutStatus(p.id, cutId)}
                                              />
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right: Consolidated Materials & Glass Lists */}
                          <div className="lg:col-span-5 space-y-6">
                            
                            {/* Unified Materials, Glass & Accessories Purchase Box */}
                            <div className="bg-brand-sidebar border border-brand-border p-6 rounded-[2rem] shadow-xl relative overflow-hidden space-y-6">
                              <div className="flex justify-between items-center mb-1">
                                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                                  <ClipboardList size={16} className="text-brand-accent shrink-0" /> Resumen de Compra de Materiales
                                </h3>
                                <span className="px-2 py-0.5 bg-brand-border rounded text-[8px] font-bold text-brand-muted uppercase tracking-wider font-mono">
                                  Barras 250"
                                </span>
                              </div>

                              <div className="space-y-6">
                                {/* Grid container for Profiles and Glass side-by-side */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  
                                  {/* Profiles Box (Cuadrito bonito) */}
                                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                                    <div className="border-b border-white/10 pb-1.5 flex justify-between items-center">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                        P65 ({consolidatedMaterials.profiles[0]?.color || "Blanco"})
                                      </span>
                                    </div>
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="text-brand-muted uppercase text-[9px] tracking-widest border-b border-white/5">
                                          <th className="py-1 font-bold">perfil</th>
                                          <th className="py-1 text-right font-bold w-12">canti</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/[0.02]">
                                        {consolidatedMaterials.profiles.length > 0 ? (
                                          consolidatedMaterials.profiles.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.01]">
                                              <td className="py-2 font-semibold text-white/90 capitalize text-[11px]">{p.name}</td>
                                              <td className="py-2 text-right font-mono font-black text-brand-accent text-[11px]">{p.barsNeeded}</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={2} className="py-2 text-center text-[10px] italic text-brand-muted opacity-40">Sin perfiles</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Glass Box (Cuadrito bonito) */}
                                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-3">
                                    <div className="border-b border-white/10 pb-1.5 flex justify-between items-center">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]">
                                        Detalle de Cristales
                                      </span>
                                    </div>
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="text-brand-muted uppercase text-[9px] tracking-widest border-b border-white/5">
                                          <th className="py-1 font-bold">medida</th>
                                          <th className="py-1 text-right font-bold w-12">canti</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/[0.02]">
                                        {clientGlassSummary.length > 0 ? (
                                          clientGlassSummary.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.01]">
                                              <td className="py-2 font-mono text-white/90 text-[11px]">{item.dimensions}"</td>
                                              <td className="py-2 text-right font-mono font-black text-[#22c55e] text-[11px]">x{item.qty}</td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={2} className="py-2 text-center text-[10px] italic text-brand-muted opacity-40">Sin cristales</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                </div>

                                {/* Divider & Accessories Section (Dividido de último) */}
                                <div className="border-t border-white/10 pt-4 space-y-3">
                                  <div className="flex justify-between items-center pb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                      Accesorios Requeridos
                                    </span>
                                  </div>
                                  <div className="divide-y divide-white/5 text-xs bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
                                    {consolidatedMaterials.accessories.map((acc, index) => (
                                      <div key={index} className="px-4 py-2.5 flex justify-between items-center hover:bg-white/[0.02] transition-colors">
                                        <span className="font-semibold text-brand-muted capitalize text-[11px]">{acc.name.toLowerCase()}</span>
                                        <span className="text-white font-mono font-black text-[11px]">{acc.qty} {acc.unit}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                              </div>

                              {/* WhatsApp Share Button */}
                              <button
                                onClick={() => {
                                  const formatWhatsAppTable = (items: { name: string; qty: string }[], header1: string, header2: string): string => {
                                    const col1Width = 18;
                                    const col2Width = 8;
                                    const borderLine = `+${"-".repeat(col1Width + 2)}+${"-".repeat(col2Width + 2)}+\n`;
                                    
                                    let table = "```\n";
                                    table += borderLine;
                                    const h1 = header1.toUpperCase().padEnd(col1Width);
                                    const h2 = header2.toUpperCase().padEnd(col2Width);
                                    table += `| ${h1} | ${h2} |\n`;
                                    table += borderLine;
                                    
                                    items.forEach((item) => {
                                      const namePart = item.name.toLowerCase().slice(0, col1Width).padEnd(col1Width);
                                      const qtyPart = item.qty.slice(0, col2Width).padEnd(col2Width);
                                      table += `| ${namePart} | ${qtyPart} |\n`;
                                    });
                                    
                                    table += borderLine;
                                    table += "```";
                                    return table;
                                  };

                                  const activeColor = consolidatedMaterials.profiles[0]?.color || "Blanco";
                                  let message = `*P65 (${activeColor.toUpperCase()})*\n`;

                                  const profileLines = consolidatedMaterials.profiles.map(p => ({
                                    name: p.name,
                                    qty: String(p.barsNeeded)
                                  }));
                                  message += formatWhatsAppTable(profileLines, "perfil", "canti") + "\n\n";

                                  if (clientGlassSummary.length > 0) {
                                    message += `*Vidrios*\n`;
                                    const glassLines = clientGlassSummary.map(g => ({
                                      name: g.dimensions,
                                      qty: String(g.qty)
                                    }));
                                    message += formatWhatsAppTable(glassLines, "medida", "canti") + "\n\n";
                                  }

                                  if (consolidatedMaterials.accessories.length > 0) {
                                    message += `*Accesorios*\n`;
                                    const accLines = consolidatedMaterials.accessories.map(acc => ({
                                      name: acc.name,
                                      qty: String(acc.qty)
                                    }));
                                    message += formatWhatsAppTable(accLines, "detalle", "canti") + "\n\n";
                                  }

                                  const url = `https://wa.me/18094130846?text=${encodeURIComponent(message)}`;
                                  window.open(url, "_blank");
                                }}
                                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-extrabold uppercase text-xs shadow-xl transition-all duration-300"
                              >
                                <MessageCircle size={20} className="fill-white/10" strokeWidth={2.5} /> Enviar Detalle por WhatsApp
                              </button>

                            </div>

                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="py-20 text-center text-brand-muted opacity-40">¡Ha ocurrido un error al cargar el cliente!</div>
                    )
                  )}
                </section>
              )}


              {/* Empty States */}
              {!selectedClientName &&
                activeView === "dashboard" &&
                projects.filter((p) => p.status === "pending").length === 0 && (
                  <div className="py-20 text-center opacity-20">
                    <CheckCircle2
                      size={40}
                      className="mx-auto mb-4 text-emerald-500"
                    />
                    <p className="text-xs font-black uppercase tracking-[0.5em]">
                      ¡Todo al día! — No hay ordenes activas
                    </p>
                  </div>
                )}

              {!selectedClientName &&
                activeView === "history" &&
                projects.filter((p) => p.status === "completed").length ===
                  0 && (
                  <div className="py-20 text-center opacity-20">
                    <History
                      size={40}
                      className="mx-auto mb-4 text-brand-muted"
                    />
                    <p className="text-xs font-black uppercase tracking-[0.5em]">
                      Historial Vacío
                    </p>
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
                        <h3 className="text-xl font-black text-white italic truncate max-w-[200px] sm:max-w-none">
                          {selectedClientName}
                        </h3>
                        <p className="text-[10px] text-brand-muted uppercase tracking-[0.2em] font-medium">
                          Detalles de producción
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsPrintMode(true);
                        }}
                        className="flex-1 sm:flex-none px-5 h-10 bg-brand-accent/20 border border-brand-accent/30 rounded-xl text-[10px] font-black text-brand-accent uppercase tracking-widest hover:bg-brand-accent/30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/10"
                      >
                        <Printer size={14} /> Reporte PDF
                      </button>
                      {allByClient.find((g) => g.name === selectedClientName)
                        ?.progress === 100 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Desea finalizar esta orden y moverla al historial?",
                              )
                            ) {
                              setProjects((prev) =>
                                prev.map((p) =>
                                  p.clientName === selectedClientName
                                    ? { ...p, status: "completed" }
                                    : p,
                                ),
                              );
                              setSelectedClientName(null);
                            }
                          }}
                          className="flex-1 sm:flex-none px-5 h-10 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={14} /> Finalizar Pedido
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedClientName(null)}
                        className="flex-1 sm:flex-none px-5 h-10 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowLeft size={14} /> Regresar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-24">
                    {allByClient
                      .filter((g) => g.name === selectedClientName)
                      .map((group) => (
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
                                    <h4 className="text-2xl font-black text-white italic truncate tracking-tight uppercase">
                                      {group.name}
                                    </h4>
                                    <p className="text-[10px] font-mono text-brand-muted tracking-[0.2em] uppercase opacity-50">
                                      Orden de Trabajo
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-4 text-[9px] font-mono font-black uppercase text-brand-muted/60">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
                                    <Calendar
                                      size={12}
                                      className="text-brand-accent"
                                    />
                                    <span>
                                      Entrada:{" "}
                                      {new Date(
                                        group.entryDate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>

                                  {group.phone && (
                                    <a
                                      href={`https://wa.me/${group.phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 bg-brand-accent/10 rounded-xl border border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20 transition-all cursor-pointer shadow-sm"
                                    >
                                      <Phone size={14} />
                                      <span className="font-bold text-[10px]">{group.phone}</span>
                                    </a>
                                  )}

                                  {group.location && (
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.location)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
                                    >
                                      <MapPin size={14} />
                                      <span className="font-bold text-[10px]">{group.location}</span>
                                    </a>
                                  )}

                                  {group.exitDate && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-accent/10 rounded-full border border-brand-accent/20 text-brand-accent">
                                      <Clock size={12} />
                                      <span>
                                        Egresó:{" "}
                                        {new Date(
                                          group.exitDate,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
                                    <CheckCircle2 size={12} />
                                    <span>
                                      {group.doneWindows} / {group.totalWindows}{" "}
                                      Entregadas
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="w-full md:w-48 text-right space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
                                    Producción
                                  </span>
                                  <span className="text-3xl font-mono font-black italic text-brand-accent">
                                    {group.progress}%
                                  </span>
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

                            </div>

                            {/* Client Projects Grid */}
                            <div className="space-y-12">
                              {/* Pending Windows */}
                              {group.pending.length > 0 && (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">
                                      En Proceso ({group.pending.length})
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AnimatePresence mode="popLayout">
                                      {group.pending.map((project) => {
                                        const totalCuts =
                                          project.results.marco.length +
                                          project.results.hojas.length +
                                          project.results.vidrios.length;
                                        const isFullyCut =
                                          project.completedCuts.length ===
                                          totalCuts;
                                        return (
                                          <motion.div
                                            layout
                                            key={project.id}
                                            initial={{
                                              opacity: 0,
                                              scale: 0.95,
                                            }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`p-6 rounded-[2rem] flex flex-col gap-6 relative group border transition-all cursor-pointer ${
                                              isFullyCut
                                                ? "bg-red-500/10 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                                : "bg-brand-sidebar/60 border-brand-border hover:border-brand-accent/40"
                                            }`}
                                            onClick={() =>
                                              setSelectedProject(project)
                                            }
                                          >
                                            <div className="flex justify-between items-start">
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                  <h4
                                                    className={`text-base font-black uppercase truncate pr-4 ${isFullyCut ? "text-red-400" : "text-white"}`}
                                                  >
                                                    {project.type === "PUERTA_COMERCIAL" ? project.name : `${project.name} (${project.vias} Vías - ${project.type})`}
                                                  </h4>
                                                  <Info
                                                    size={14}
                                                    className={
                                                      isFullyCut
                                                        ? "text-red-500"
                                                        : "text-brand-accent opacity-50"
                                                    }
                                                  />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                  <p
                                                    className={`text-[10px] font-mono font-bold tracking-tighter uppercase whitespace-nowrap ${isFullyCut ? "text-red-400/60" : "text-brand-accent"}`}
                                                  >
                                                    {formatFraction(
                                                      project.width,
                                                    )}{" "}
                                                    x{" "}
                                                    {formatFraction(
                                                      project.height,
                                                    )}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="relative h-20 flex items-center -mx-2">
                                              <div
                                                className={`absolute inset-0 opacity-10 blur-xl rounded-full scale-50 ${isFullyCut ? "bg-red-500" : "bg-brand-accent"}`}
                                              />
                                              <WindowPreview
                                                width={project.width}
                                                height={project.height}
                                                wTop={project.wTop}
                                                wBottom={project.wBottom}
                                                hLeft={project.hLeft}
                                                hRight={project.hRight}
                                                vias={project.vias}
                                                windowType={project.type}
                                              />
                                            </div>
                                            <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                              <motion.div
                                                initial={{ width: 0 }}
                                                animate={{
                                                  width: `${Math.round((project.completedCuts.length / totalCuts) * 100)}%`,
                                                }}
                                                className={`h-full ${isFullyCut ? "bg-red-500" : "bg-brand-accent"}`}
                                              />
                                            </div>

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
                                    <span className="text-[9px] font-black text-brand-muted uppercase tracking-widest">
                                      Finalizadas ({group.completed.length})
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {group.completed.map((project) => (
                                      <div
                                        key={project.id}
                                        onClick={() =>
                                          setSelectedProject(project)
                                        }
                                        className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all"
                                      >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                <Check size={10} strokeWidth={3} />
                                              </div>
                                              <p className="text-[10px] font-black text-white/50 uppercase truncate">
                                                {project.name}
                                              </p>
                                            </div>
                                          </div>
                                    ))}
                                  </div>
                                </div>
                              )}


                            </div>
                        </motion.div>
                      ))}

                    {projects.length === 0 && (
                      <div className="py-20 text-center opacity-10">
                        <p className="text-xs font-black uppercase tracking-[0.5em]">
                          Sistema Vacío — Añada una orden arriba
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {isPrintMode && selectedClientName && (
        <PrintReport
          clientName={selectedClientName}
          projects={projects.filter((p) => p.clientName === selectedClientName)}
          onExit={() => setIsPrintMode(false)}
          linearPrice={linearPrice}
          setLinearPrice={setLinearPrice}
          barLength={barLength}
          setBarLength={setBarLength}
        />
      )}

      {isSinglePrintMode && singlePrintProject && (
        <div className="fixed inset-0 z-[500] bg-white text-black p-4 overflow-y-auto font-sans print:p-0 print:relative print:block print:z-0 print:bg-white print:min-h-screen">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-4 print:hidden">
              <div className="flex items-center gap-4">
                <BrandLogo className="w-12 h-12" />
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
                    <span className="text-red-600">HARMONY</span> <span className="text-blue-700">GLASS</span>
                  </h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Ficha Técnica Individual</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-6 h-12 bg-black text-white rounded-xl font-black uppercase text-xs flex items-center gap-2 shadow-xl hover:bg-gray-900 transition-all"
                >
                  <Printer size={16} /> Imprimir Ficha
                </button>
                <button
                  onClick={() => setIsSinglePrintMode(false)}
                  className="px-6 h-12 bg-gray-100 text-black border border-gray-200 rounded-xl font-black uppercase text-xs flex items-center gap-2"
                >
                  <X size={16} /> Cerrar
                </button>
              </div>
            </div>

            <div className="border-[6px] border-black p-8 space-y-8 bg-white shadow-2xl print:shadow-none print:border-[4px]">
              <div className="flex justify-between items-start gap-8 border-b-2 border-black pb-6">
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">CLIENTE / PROYECTO</p>
                    <h2 className="text-4xl font-black uppercase italic leading-tight">{singlePrintProject.clientName}</h2>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">ETIQUETA DE VENTANA</p>
                    <h3 className="text-2xl font-black uppercase">{singlePrintProject.name}</h3>
                  </div>
                </div>
                <div className="text-right space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">SISTEMA (PERFIL)</p>
                    <div className="bg-black text-white px-4 py-2 inline-block rounded-lg">
                      <p className="text-2xl font-black italic">{singlePrintProject.type}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">FECHA</p>
                    <p className="text-lg font-black font-mono">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 py-4">
                <div className="space-y-2 border-2 border-black p-6 rounded-2xl bg-gray-50">
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-center text-gray-500">MEDIDAS VANO (W x H)</p>
                  <p className="text-5xl font-black text-center tabular-nums italic">
                    {formatFraction(singlePrintProject.width)} <span className="text-gray-400">x</span> {formatFraction(singlePrintProject.height)}
                  </p>
                </div>
                <div className="flex items-center justify-center border-2 border-black rounded-2xl overflow-hidden bg-black/5 p-4">
                  <div className="scale-[1.8] origin-center opacity-80">
                    <WindowPreview
                      width={singlePrintProject.width}
                      height={singlePrintProject.height}
                      wTop={singlePrintProject.wTop}
                      wBottom={singlePrintProject.wBottom}
                      hLeft={singlePrintProject.hLeft}
                      hRight={singlePrintProject.hRight}
                      vias={singlePrintProject.vias}
                      windowType={singlePrintProject.type}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-center gap-4">
                  <div className="h-0.5 bg-black flex-1" />
                  <h4 className="text-sm font-black uppercase tracking-[0.5em]">PLANILLA DE CORTE</h4>
                  <div className="h-0.5 bg-black flex-1" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {[
                    { label: singlePrintProject.type === "GAVETAS" ? "MOLDURAS" : "MARCO", items: singlePrintProject.results.marco },
                    { label: singlePrintProject.type === "GAVETAS" ? "FACIAS" : "HOJAS", items: singlePrintProject.results.hojas },
                    { label: "CRISTAL / VIDRIO", items: singlePrintProject.results.vidrios },
                  ].map((cat) => {
                    if (cat.items.length === 0) return null;
                    return (
                      <div key={cat.label} className="space-y-2">
                        <div className="bg-black text-white px-3 py-1 inline-block text-[10px] font-black uppercase tracking-widest">
                          {cat.label}
                        </div>
                        <table className="w-full border-collapse border-2 border-black text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-black font-black uppercase tracking-widest text-[10px]">
                              <th className="border-2 border-black px-4 py-2 text-left">PIEZA</th>
                              <th className="border-2 border-black px-4 py-2 w-20 text-center">CANT.</th>
                              <th className="border-2 border-black px-4 py-2 w-48 text-right">MEDIDA FINAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cat.items.map((item) => (
                              <tr key={item.id} className="font-black">
                                <td className="border-2 border-black px-4 py-3 uppercase italic">{item.piece}</td>
                                <td className="border-2 border-black px-4 py-3 text-center text-xl">{item.qty}</td>
                                <td className="border-2 border-black px-4 py-3 text-right text-2xl font-mono tabular-nums leading-none">
                                  {item.dimensions || formatFraction(item.size)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>


              </div>

              <div className="pt-10 flex justify-between items-end italic opacity-40 text-[10px] font-black uppercase tracking-[0.4em]">
                <div className="flex items-center gap-3">
                  <BrandLogo className="w-8 h-8 filter grayscale" />
                  <div className="flex items-center gap-2">
                    <span className="text-red-700">HARMONY</span> 
                    <span className="text-blue-700 border-l-2 border-black pl-2">GLASS PRODUCTION DIGITAL</span>
                  </div>
                </div>
                <div>AUTORIZADO POR: _______________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] w-[96%] max-w-xl flex items-center gap-1 p-1 bg-brand-sidebar/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] print:hidden">
        <button
          onClick={() => {
            setActiveView("dashboard");
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest transition-all z-10 ${activeView === "dashboard" ? "text-white" : "text-brand-muted hover:text-white"}`}
        >
          {activeView === "dashboard" && (
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
          onClick={startNewOrder}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest transition-all z-10 ${activeView === "new-order" ? "text-white" : "text-brand-muted hover:text-white"}`}
        >
          {activeView === "new-order" && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Plus size={16} className="relative z-10" strokeWidth={3} />
          <span className="relative z-10 text-[7px] sm:text-[9px]">Nuevo</span>
        </button>
        <button
          onClick={() => {
            setActiveView("history");
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest transition-all z-10 ${activeView === "history" ? "text-white" : "text-brand-muted hover:text-white"}`}
        >
          {activeView === "history" && (
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
          onClick={() => {
            setActiveView("unfinished");
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest transition-all z-10 ${activeView === "unfinished" ? "text-white" : "text-brand-muted hover:text-white"}`}
        >
          {activeView === "unfinished" && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Clock size={16} className="relative z-10" strokeWidth={3} />
          <span className="relative z-10">Sin Terminar</span>
        </button>
        <button
          onClick={() => {
            setActiveView("detail");
            setSelectedClientName(null);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`relative flex-1 h-12 rounded-[1.5rem] flex items-center justify-center gap-2 font-black uppercase text-[8px] sm:text-[9px] tracking-widest transition-all z-10 ${activeView === "detail" ? "text-white" : "text-brand-muted hover:text-white"}`}
        >
          {activeView === "detail" && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-red-600 rounded-[1.5rem] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <Info size={16} className="relative z-10" />
          <span className="relative z-10">Detalle</span>
        </button>
      </nav>

      <footer className="py-24 px-4 bg-brand-bg text-center relative z-20 print:hidden items-center flex flex-col justify-center space-y-6">
        <BrandLogo className="w-16 h-16 opacity-30 grayscale brightness-150" />
        <div className="flex flex-col items-center">
            <h2 className="text-sm font-black tracking-[0.5em] uppercase italic flex items-center gap-2">
                <span className="text-red-600">HARMONY</span>
                <span className="text-blue-500">GLASS</span>
            </h2>
            <p className="text-[9px] text-brand-muted uppercase tracking-[0.4em] font-black opacity-30 mt-2">
                2.7.0
            </p>
        </div>
      </footer>

      {/* Project Detail Portal (Modal) */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-6 print:hidden">
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
                    <span className="px-2 py-0.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-[8px] font-black text-brand-accent uppercase tracking-widest">
                      Corte Detallado
                    </span>
                    <h2 className="text-xl sm:text-3xl font-black text-white italic tracking-tighter uppercase truncate">
                      {selectedProject.name}
                    </h2>
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
                    <WindowPreview
                      width={selectedProject.width}
                      height={selectedProject.height}
                      wTop={selectedProject.wTop}
                      wBottom={selectedProject.wBottom}
                      hLeft={selectedProject.hLeft}
                      hRight={selectedProject.hRight}
                      vias={selectedProject.vias}
                      windowType={selectedProject.type}
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:gap-3 overflow-hidden">
                    <div className="space-y-0.5">
                      <p className="text-[7px] sm:text-[9px] text-brand-muted uppercase font-black tracking-widest opacity-30 italic">
                        Medidas Vano
                      </p>
                      <p className="text-sm sm:text-lg font-mono font-black text-white tabular-nums italic">
                        {formatFraction(selectedProject.width)}{" "}
                        <span className="text-brand-accent">x</span>{" "}
                        {formatFraction(selectedProject.height)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="space-y-0.5 shrink-0">
                        <p className="text-[7px] text-brand-muted uppercase font-black opacity-30">
                          Alta
                        </p>
                        <p className="text-[9px] font-mono text-white/60">
                          {new Date(
                            selectedProject.createdAt,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedProject.deliveryDate && (
                        <div className="space-y-0.5 shrink-0">
                          <p className="text-[7px] text-brand-muted uppercase font-black opacity-30">
                            Salida
                          </p>
                          <p className="text-[9px] font-mono text-brand-accent">
                            {new Date(
                              selectedProject.deliveryDate,
                            ).toLocaleDateString()}
                          </p>
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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">
                      Checklist de Producción
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-brand-muted uppercase">
                    {selectedProject.completedCuts.length} de{" "}
                    {selectedProject.results.marco.length +
                      selectedProject.results.hojas.length +
                      selectedProject.results.vidrios.length}{" "}
                    CORTES
                  </div>
                </div>

                <ResultsBreakdown
                  results={selectedProject.results}
                  windowType={selectedProject.type}
                  completedCuts={selectedProject.completedCuts}
                  onToggleCut={(cutId) =>
                    toggleCutStatus(selectedProject.id, cutId)
                  }
                />

                <div className="p-6 bg-brand-bg/50 border border-brand-border rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3">
                    <Info size={16} className="text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-muted">
                      Información Adicional
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Este desglose ha sido calculado utilizando el estándar de
                    ingeniería para perfiles de 2 pulgadas. Asegurese de
                    verificar las tolerancias de ±1/16" durante el proceso de
                    corte.
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 print:hidden">
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
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                  Acceso Restringido
                </h3>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest leading-loose">
                  Ingrese clave de autorización para eliminar el registro
                </p>
              </div>

              <div className="flex gap-3 h-12">
                {[1, 2, 3, 4].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${passInput.length > i ? "bg-brand-accent border-brand-accent shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "border-brand-border"}`}
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
                      else if (passInput.length < 4)
                        setPassInput((prev) => prev + val);
                    }}
                    className={`h-14 rounded-2xl flex items-center justify-center font-mono font-black border transition-all ${
                      val === "C"
                        ? "bg-red-500/10 border-red-500/20 text-red-500 text-xs"
                        : "bg-white/5 border-white/10 text-white text-xl"
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

      {/* Botón de WhatsApp Flotante (Fantasmita de Ayuda) */}
      <motion.a
        href="https://wa.me/18094130846"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.85, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.05 }}
        className="fixed bottom-20 right-6 z-[200] flex flex-col items-center gap-1 group print:hidden select-none"
        title="Ayuda Directa por WhatsApp"
      >
        {/* Globito de diálogo que dice "Ayuda" */}
        <motion.div 
          animate={{ y: [2, -2, 2] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg border border-emerald-400/35 flex items-center gap-1 relative"
        >
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          <span>Ayuda ✨</span>
          {/* Triangulito de bocadillo */}
          <div className="absolute bottom-[-3px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[3.5px] border-t-emerald-500" />
        </motion.div>

        {/* El fantasmita animado */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
            rotate: [-3, 3, -3],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.8, 
            ease: "easeInOut" 
          }}
          className="relative drop-shadow-[0_8px_16px_rgba(16,185,129,0.35)] filter"
        >
          <svg width="56" height="56" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#f0fdf4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {/* Cuerpo del fantasmita */}
            <path 
              d="M 20 45 
                 C 20 15, 80 15, 80 45 
                 C 80 65, 75 75, 70 75 
                 C 64 75, 60 65, 55 70 
                 C 50 75, 45 70, 40 70 
                 C 35 70, 30 75, 25 75 
                 C 20 75, 20 65, 20 45 Z" 
              fill="url(#ghostGrad)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Brazos tiernos */}
            <path d="M 18 46 Q 10 42, 14 38" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 82 46 Q 90 42, 86 38" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            
            {/* Ojitos tiernos y expresivos */}
            <circle cx="38" cy="40" r="4.5" fill="#044e37" />
            <circle cx="62" cy="40" r="4.5" fill="#044e37" />
            <circle cx="36.5" cy="38" r="1.5" fill="#ffffff" />
            <circle cx="60.5" cy="38" r="1.5" fill="#ffffff" />
            
            {/* Mejillas sonrojadas rositas */}
            <circle cx="31" cy="46" r="3.5" fill="#f43f5e" opacity="0.65" />
            <circle cx="69" cy="46" r="3.5" fill="#f43f5e" opacity="0.65" />
            
            {/* Boquita sonriente */}
            <path d="M 45 46 Q 50 51, 55 46" stroke="#044e37" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>

          {/* Mini logo de WhatsApp verde flotando al lado del fantasmita */}
          <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full border border-emerald-400 shadow-md group-hover:scale-110 transition-transform">
            <MessageCircle size={10} className="fill-white" />
          </div>
        </motion.div>
      </motion.a>
    </div>
  );
}
