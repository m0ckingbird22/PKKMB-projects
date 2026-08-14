"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DayPickerProps {
  value: number;
  onChange: (day: number) => void;
  totalDays?: number;
  label?: string;
}

export function DayPicker({
  value,
  onChange,
  totalDays = 6,
  label = "PILIH HARI",
}: DayPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="w-full">
      <h2 className="mb-3 text-sm font-semibold text-gray-300">{label}</h2>
      <div ref={ref} className="relative w-full sm:max-w-[12rem]">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="relative w-full cursor-pointer rounded-lg border border-gray-700 bg-[#1d1c1c] py-2.5 pl-9 pr-10 text-left text-sm text-white focus:outline-none"
        >
          <Calendar className="pointer-events-none absolute left-3 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-gray-500" />
          <span>Hari {value}</span>
          <ChevronDown
            className={`pointer-events-none absolute right-3 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <ul
            role="listbox"
            className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1d1c1c] py-1 shadow-xl"
          >
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
              <li key={d}>
                <button
                  type="button"
                  role="option"
                  aria-selected={d === value}
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                    d === value
                      ? "bg-twilight text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  Hari {d}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
