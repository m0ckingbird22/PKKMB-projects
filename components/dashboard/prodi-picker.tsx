"use client";

import { useState, useRef, useEffect } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

interface Prodi {
  id: string;
  nama: string;
}

interface ProdiPickerProps {
  value: string;
  onChange: (value: string) => void;
  prodiList: Prodi[];
}

export function ProdiPicker({ value, onChange, prodiList }: ProdiPickerProps) {
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

  const selectedName =
    value === ""
      ? "Semua Prodi"
      : prodiList.find((p) => p.id === value)?.nama ?? "Semua Prodi";

  return (
    <div ref={ref} className="relative w-full sm:w-56">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="relative w-full cursor-pointer rounded-lg border border-gray-700 bg-[#2c2c2c] py-2 pl-9 pr-10 text-left text-sm text-white focus:outline-none"
      >
        <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-gray-500" />
        <span className="block truncate">{selectedName}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 z-10 w-4 h-4 -translate-y-1/2 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-700 bg-[#1d1c1c] py-1 shadow-xl"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                value === ""
                  ? "bg-twilight text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Semua Prodi
            </button>
          </li>
          {prodiList.map((prodi) => (
            <li key={prodi.id}>
              <button
                type="button"
                role="option"
                aria-selected={value === prodi.id}
                onClick={() => {
                  onChange(prodi.id);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm transition-colors ${
                  value === prodi.id
                    ? "bg-twilight text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {prodi.nama}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
