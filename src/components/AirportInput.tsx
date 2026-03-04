import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Layers, ChevronRight } from 'lucide-react';
import { searchAirports, type AirportEntry } from '../data/airports';

interface AirportInputProps {
  value: string;
  onChange: (iata: string, entry?: AirportEntry) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function AirportInput({ value, onChange, placeholder = 'GRU', className = '', error = false }: AirportInputProps) {
  const [inputText, setInputText] = useState(value);
  const [suggestions, setSuggestions] = useState<AirportEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep inputText in sync when value changes externally (e.g. swap button)
  useEffect(() => {
    setInputText(value);
  }, [value]);

  const handleInput = useCallback((text: string) => {
    setInputText(text);
    const results = searchAirports(text);
    setSuggestions(results);
    setOpen(results.length > 0);
    setHighlightIndex(-1);
    // If input is exactly 3 chars, pass it up directly even without selection
    if (text.length === 3 && /^[A-Za-z]{3}$/.test(text)) {
      onChange(text.toUpperCase());
    } else if (text.length === 0) {
      onChange('');
    }
  }, [onChange]);

  const select = useCallback((entry: AirportEntry) => {
    setInputText(entry.iata);
    setSuggestions([]);
    setOpen(false);
    setHighlightIndex(-1);
    onChange(entry.iata, entry);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0) select(suggestions[highlightIndex]);
      else if (suggestions.length === 1) select(suggestions[0]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputText}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => {
          if (inputText.length >= 2) {
            const results = searchAirports(inputText);
            setSuggestions(results);
            setOpen(results.length > 0);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={30}
        autoComplete="off"
        spellCheck={false}
        className={`input-dark w-full ${
          inputText.length === 3 && /^[A-Z]{3}$/.test(inputText)
            ? 'text-xl font-bold tracking-widest'
            : 'text-sm'
        } ${error ? 'border-red-500/60' : ''} ${className}`}
      />

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl overflow-hidden overflow-y-auto max-h-72 shadow-2xl"
          style={{
            background: 'rgba(20, 18, 48, 0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          {suggestions.map((entry, i) => (
            <SuggestionItem
              key={entry.iata}
              entry={entry}
              highlighted={i === highlightIndex}
              onMouseEnter={() => setHighlightIndex(i)}
              onClick={() => select(entry)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface SuggestionItemProps {
  entry: AirportEntry;
  highlighted: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

function SuggestionItem({ entry, highlighted, onMouseEnter, onClick }: SuggestionItemProps) {
  return (
    <li
      onMouseEnter={onMouseEnter}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors select-none ${
        highlighted ? 'bg-indigo-600/30' : 'hover:bg-white/5'
      }`}
    >
      {/* Icon */}
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        entry.isCity ? 'bg-violet-500/20' : 'bg-indigo-500/15'
      }`}>
        {entry.isCity
          ? <Layers size={14} className="text-violet-400" />
          : <MapPin size={14} className="text-indigo-400" />
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm font-mono ${entry.isCity ? 'text-violet-300' : 'text-white'}`}>
            {entry.iata}
          </span>
          <span className="text-xs text-white/40 truncate">{entry.state}</span>
        </div>
        <div className="text-xs text-white/50 truncate leading-tight mt-0.5">
          {entry.isCity ? (
            <span className="text-violet-300/70">
              Todos os aeroportos de {entry.city}
              {entry.airports && (
                <span className="text-white/30 ml-1">({entry.airports.join(', ')})</span>
              )}
            </span>
          ) : (
            <>
              <span className="text-white/70 font-medium">{entry.city}</span>
              {' · '}
              <span className="truncate">{entry.name}</span>
            </>
          )}
        </div>
      </div>

      <ChevronRight size={13} className="shrink-0 text-white/20" />
    </li>
  );
}
