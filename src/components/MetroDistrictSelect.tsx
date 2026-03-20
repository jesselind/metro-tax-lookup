"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import type { MetroDistrictOption } from "@/lib/levyTypes";

const MAX_NAME_LEN = 48;
const RATE_TO_MILLS = 1000;

function formatOptionLabel(m: MetroDistrictOption): string {
  const name =
    m.name.length > MAX_NAME_LEN
      ? `${m.name.slice(0, MAX_NAME_LEN - 1)}...`
      : m.name;
  const debtMills = m.debtMills * RATE_TO_MILLS;
  const totalMills = m.totalMills * RATE_TO_MILLS;
  return `${name} - metro mills ${totalMills.toFixed(3)} (debt mills ${debtMills.toFixed(3)})`;
}

type MetroDistrictSelectProps = {
  metroOptions: MetroDistrictOption[];
  selectedMetroId: string;
  onSelect: (id: string) => void;
};

export function MetroDistrictSelect({
  metroOptions,
  selectedMetroId,
  onSelect,
}: MetroDistrictSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = metroOptions.find((m) => m.id === selectedMetroId);
  const displayLabel = selected
    ? formatOptionLabel(selected)
    : "Choose your district...";

  const activeDescendantId = isOpen
    ? focusedIndex === -1
      ? "metro-option-none"
      : `metro-option-${metroOptions[focusedIndex]?.id}`
    : undefined;

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const id =
      focusedIndex === -1
        ? "metro-option-none"
        : `metro-option-${metroOptions[focusedIndex]?.id}`;
    const opt = id ? document.getElementById(id) : null;
    opt?.scrollIntoView({ block: "nearest" });
  }, [isOpen, focusedIndex, metroOptions]);

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        const idx = selectedMetroId
          ? metroOptions.findIndex((m) => m.id === selectedMetroId)
          : -1;
        setFocusedIndex(idx >= 0 ? idx : -1);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) =>
        i < metroOptions.length - 1 ? i + 1 : i
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => (i > -1 ? i - 1 : -1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex === -1) {
        onSelect("");
      } else if (metroOptions[focusedIndex]) {
        onSelect(metroOptions[focusedIndex].id);
      }
      setIsOpen(false);
    }
  }

  return (
    <div className="relative mt-2" ref={containerRef}>
      <label id="metro-select-label" className="sr-only">
        Select metropolitan district
      </label>
      <button
        type="button"
        id="metro-select"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="metro-listbox"
        aria-labelledby="metro-select-label"
        aria-activedescendant={activeDescendantId}
        className="flex min-h-[2.75rem] w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-base shadow-sm focus:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-700/30"
        onClick={() => {
          if (!isOpen) {
            const idx = selectedMetroId
              ? metroOptions.findIndex((m) => m.id === selectedMetroId)
              : -1;
            setFocusedIndex(idx >= 0 ? idx : -1);
          }
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{displayLabel}</span>
        <span className="ml-2 shrink-0 text-indigo-700" aria-hidden>
          {isOpen ? "\u25B2" : "\u25BC"}
        </span>
      </button>
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby="metro-select-label"
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-auto rounded-md border border-indigo-400 bg-white py-1 shadow-lg"
          id="metro-listbox"
        >
          <li
            id="metro-option-none"
            role="option"
            aria-selected={!selectedMetroId}
            className={`cursor-pointer px-3 py-2.5 text-base text-slate-600 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${focusedIndex === -1 ? "bg-indigo-50" : "bg-white"
              }`}
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
            onMouseEnter={() => setFocusedIndex(-1)}
          >
            None / I don&apos;t have a metro district
          </li>
          {metroOptions.map((m, i) => (
            <li
              key={m.id}
              id={`metro-option-${m.id}`}
              role="option"
              aria-selected={m.id === selectedMetroId}
              className={`cursor-pointer px-3 py-2.5 text-base text-slate-900 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none ${i === focusedIndex ? "bg-indigo-50" : "bg-white"
                }`}
              onClick={() => {
                onSelect(m.id);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(i)}
              title={m.name.length > MAX_NAME_LEN ? m.name : undefined}
            >
              {formatOptionLabel(m)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
