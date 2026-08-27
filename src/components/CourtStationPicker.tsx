import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Landmark, Search, ChevronDown, Check, Sparkles, Building2, Scale, X, MapPin } from 'lucide-react';
import {
  CourtCategory,
  ALL_KENYA_COURT_STATIONS,
  KENYA_COURT_CATEGORIES,
  KenyaCourtStation,
  getCourtCategoryByName
} from '../data/kenyaCourts';

interface CourtStationPickerProps {
  value: string;
  onChange: (stationName: string) => void;
  availableStations?: string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  showCategoryBadge?: boolean;
}

export const CourtStationPicker: React.FC<CourtStationPickerProps> = ({
  value,
  onChange,
  availableStations,
  placeholder = 'Select Court Station...',
  disabled = false,
  required = false,
  className = '',
  showCategoryBadge = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourtCategory | 'ALL'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Combine custom availableStations with master Kenya courts dataset
  const combinedCourts = useMemo(() => {
    const map = new Map<string, KenyaCourtStation>();
    
    // Add all official Kenya courts
    ALL_KENYA_COURT_STATIONS.forEach(court => {
      map.set(court.name.toLowerCase(), court);
    });

    // Add any custom court stations provided by firm settings
    if (availableStations && availableStations.length > 0) {
      availableStations.forEach(st => {
        const key = st.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: `custom-${key.replace(/[^a-z0-9]/g, '-')}`,
            name: st,
            stationName: st,
            category: getCourtCategoryByName(st),
            stationType: 'Trial Station',
            countyOrLocation: 'Firm Custom Station'
          });
        }
      });
    }

    return Array.from(map.values());
  }, [availableStations]);

  // Filtered courts by category and search query
  const filteredCourts = useMemo(() => {
    let list = combinedCourts;

    if (selectedCategory !== 'ALL') {
      list = list.filter(c => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.stationName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.countyOrLocation && c.countyOrLocation.toLowerCase().includes(q))
      );
    }

    return list;
  }, [combinedCourts, selectedCategory, searchQuery]);

  // Group filtered courts by CourtCategory
  const groupedCourts = useMemo(() => {
    const groups: { category: CourtCategory; courts: KenyaCourtStation[] }[] = [];
    const categoryOrder: CourtCategory[] = [
      'Supreme Court',
      'Court of Appeal',
      'High Court',
      'Employment and Labour Relations Court (ELRC)',
      'Magistrates\' Courts (Law Courts)',
      'Small Claims Court (SCC)',
      'Kadhis\' Court',
      'Children\'s Court'
    ];

    categoryOrder.forEach(cat => {
      const courtsInCat = filteredCourts.filter(c => c.category === cat);
      if (courtsInCat.length > 0) {
        groups.push({ category: cat, courts: courtsInCat });
      }
    });

    return groups;
  }, [filteredCourts]);

  const currentCategory = value ? getCourtCategoryByName(value) : undefined;
  const currentCategoryMeta = currentCategory
    ? KENYA_COURT_CATEGORIES.find(c => c.category === currentCategory)
    : undefined;

  const handleSelect = (courtName: string) => {
    onChange(courtName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 bg-slate-950 border rounded-xl text-left flex items-center justify-between transition cursor-pointer text-xs ${
          isOpen
            ? 'border-[#C9A227] ring-1 ring-[#C9A227]/50 text-white'
            : 'border-slate-800 hover:border-slate-700 text-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <Landmark className="w-4 h-4 text-[#C9A227] shrink-0" />
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-white truncate">{value}</span>
              {showCategoryBadge && currentCategoryMeta && (
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border shrink-0 ${currentCategoryMeta.badgeColor}`}
                >
                  {currentCategoryMeta.shortLabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-[#081729] border border-[#C9A227]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[420px] w-full min-w-[320px] sm:min-w-[420px] max-w-[560px]">
          
          {/* Header & Search Bar */}
          <div className="p-3 border-b border-slate-800 bg-[#0B1F3A]/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#C9A227]" />
                <span className="font-serif font-bold text-xs text-white">Kenya Courts Directory</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">({combinedCourts.length} Courts)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800/60"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search court station, county or type..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs focus:outline-none focus:border-[#C9A227]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#C9A227] text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({combinedCourts.length})
              </button>
              {KENYA_COURT_CATEGORIES.map(cat => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.category
                      ? 'bg-[#C9A227] text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.shortLabel} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Court Stations List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/80 p-2 space-y-3">
            {groupedCourts.length > 0 ? (
              groupedCourts.map(group => {
                const catMeta = KENYA_COURT_CATEGORIES.find(c => c.category === group.category);
                return (
                  <div key={group.category} className="space-y-1 pt-1.5 first:pt-0">
                    <div className="flex items-center justify-between px-2 py-1 sticky top-0 bg-[#081729]/95 backdrop-blur-xs z-10">
                      <span className="font-serif font-bold text-[11px] text-amber-300/90 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-[#C9A227]" />
                        {group.category}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {group.courts.length} stations
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                      {group.courts.map(court => {
                        const isSelected = value === court.name;
                        return (
                          <button
                            key={court.id}
                            type="button"
                            onClick={() => handleSelect(court.name)}
                            className={`p-2 rounded-xl text-left transition flex items-center justify-between group cursor-pointer ${
                              isSelected
                                ? 'bg-[#C9A227]/20 border border-[#C9A227] text-white'
                                : 'hover:bg-slate-900/90 text-slate-300 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#C9A227]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                              <div className="font-semibold text-xs text-white truncate">
                                {court.name}
                              </div>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-[#C9A227] shrink-0 ml-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <p className="text-xs">No court stations match "{searchQuery}"</p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchQuery.trim())}
                    className="px-3 py-1.5 bg-[#C9A227] hover:bg-[#B08D1E] text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Use "{searchQuery.trim()}" as custom station
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Selected: <strong className="text-white font-medium">{value || 'None'}</strong></span>
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="text-red-400 hover:text-red-300 text-[10px] underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
