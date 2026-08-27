export type CourtCategory =
  | 'Supreme Court'
  | 'Court of Appeal'
  | 'High Court'
  | 'Employment and Labour Relations Court (ELRC)'
  | 'Magistrates\' Courts (Law Courts)'
  | 'Small Claims Court (SCC)'
  | 'Kadhis\' Court'
  | 'Children\'s Court';

export interface KenyaCourtStation {
  id: string;
  name: string;                // Complete formal station name used across files & diaries
  stationName: string;         // Short station name (e.g. "Milimani", "Nakuru", "Kisumu")
  category: CourtCategory;
  stationType?: 'Apex' | 'Permanent Station' | 'Sub-Registry' | 'High Court Hub' | 'Trial Station' | 'Specialized Division';
  countyOrLocation?: string;
  notes?: string;
}

// 1. SUPREME COURT
const SUPREME_COURTS: KenyaCourtStation[] = [
  {
    id: 'sc-nairobi',
    name: 'Supreme Court of Kenya (Nairobi)',
    stationName: 'Nairobi',
    category: 'Supreme Court',
    stationType: 'Apex',
    countyOrLocation: 'Nairobi',
    notes: 'Single apex station; highest court in Kenya established under Article 163 of the Constitution'
  }
];

// 2. COURT OF APPEAL
const COURT_OF_APPEAL: KenyaCourtStation[] = [
  // Permanent Stations
  { id: 'coa-nairobi', name: 'Court of Appeal - Nairobi', stationName: 'Nairobi', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Nairobi' },
  { id: 'coa-mombasa', name: 'Court of Appeal - Mombasa', stationName: 'Mombasa', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Mombasa' },
  { id: 'coa-nakuru', name: 'Court of Appeal - Nakuru', stationName: 'Nakuru', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Nakuru' },
  { id: 'coa-nyeri', name: 'Court of Appeal - Nyeri', stationName: 'Nyeri', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Nyeri' },
  { id: 'coa-kisumu', name: 'Court of Appeal - Kisumu', stationName: 'Kisumu', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Kisumu' },
  { id: 'coa-eldoret', name: 'Court of Appeal - Eldoret', stationName: 'Eldoret', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Uasin Gishu' },
  { id: 'coa-kakamega', name: 'Court of Appeal - Kakamega', stationName: 'Kakamega', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Kakamega' },
  { id: 'coa-meru', name: 'Court of Appeal - Meru (Nkubu)', stationName: 'Meru (Nkubu)', category: 'Court of Appeal', stationType: 'Permanent Station', countyOrLocation: 'Meru', notes: 'Sitting at Nkubu Law Courts' },
  // Sub-registries
  { id: 'coa-malindi', name: 'Court of Appeal Sub-Registry - Malindi', stationName: 'Malindi', category: 'Court of Appeal', stationType: 'Sub-Registry', countyOrLocation: 'Kilifi' },
  { id: 'coa-embu', name: 'Court of Appeal Sub-Registry - Embu', stationName: 'Embu', category: 'Court of Appeal', stationType: 'Sub-Registry', countyOrLocation: 'Embu' },
  { id: 'coa-busia', name: 'Court of Appeal Sub-Registry - Busia', stationName: 'Busia', category: 'Court of Appeal', stationType: 'Sub-Registry', countyOrLocation: 'Busia' },
  { id: 'coa-kisii', name: 'Court of Appeal Sub-Registry - Kisii', stationName: 'Kisii', category: 'Court of Appeal', stationType: 'Sub-Registry', countyOrLocation: 'Kisii' },
  { id: 'coa-garissa', name: 'Court of Appeal Sub-Registry - Garissa', stationName: 'Garissa', category: 'Court of Appeal', stationType: 'Sub-Registry', countyOrLocation: 'Garissa' }
];

// 3. HIGH COURT STATIONS
const HIGH_COURT_NAMES = [
  'Bungoma', 'Busia', 'Eldoret', 'Embu', 'Garissa', 'Homabay', 'Kakamega', 'Vihiga',
  'Kericho', 'Bomet', 'Kerugoya', 'Kitale', 'Lodwar', 'Kapenguria', 'Kisii', 'Nyamira',
  'Narok', 'Kisumu', 'Siaya', 'Kitui', 'Machakos', 'Makueni', 'Kajiado', 'Malindi',
  'Garsen', 'Meru', 'Chuka', 'Marsabit', 'Migori', 'Mombasa', 'Kwale', 'Voi',
  'Murang\'a', 'Nairobi (Milimani)', 'Kibera', 'Kiambu', 'Thika', 'Nakuru', 'Naivasha',
  'Nyandarua', 'Kabarnet', 'Nyahururu', 'Nanyuki', 'Nyeri'
];

const HIGH_COURTS: KenyaCourtStation[] = HIGH_COURT_NAMES.map(st => ({
  id: `hc-${st.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  name: `High Court - ${st}`,
  stationName: st,
  category: 'High Court',
  stationType: 'High Court Hub',
  countyOrLocation: st
}));

// 4. EMPLOYMENT AND LABOUR RELATIONS COURT (ELRC)
const ELRC_COURTS: KenyaCourtStation[] = [
  // Full Stations
  { id: 'elrc-nairobi', name: 'ELRC - Nairobi', stationName: 'Nairobi', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Nairobi' },
  { id: 'elrc-mombasa', name: 'ELRC - Mombasa', stationName: 'Mombasa', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Mombasa' },
  { id: 'elrc-kisumu', name: 'ELRC - Kisumu', stationName: 'Kisumu', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Kisumu' },
  { id: 'elrc-nakuru', name: 'ELRC - Nakuru', stationName: 'Nakuru', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Nakuru' },
  { id: 'elrc-kericho', name: 'ELRC - Kericho', stationName: 'Kericho', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Kericho' },
  { id: 'elrc-nyeri', name: 'ELRC - Nyeri', stationName: 'Nyeri', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Nyeri' },
  { id: 'elrc-eldoret', name: 'ELRC - Eldoret', stationName: 'Eldoret', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Uasin Gishu' },
  { id: 'elrc-kakamega', name: 'ELRC - Kakamega', stationName: 'Kakamega', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Permanent Station', countyOrLocation: 'Kakamega' },
  // Sub-registries
  { id: 'elrc-malindi', name: 'ELRC Sub-Registry - Malindi', stationName: 'Malindi', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Kilifi' },
  { id: 'elrc-machakos', name: 'ELRC Sub-Registry - Machakos', stationName: 'Machakos', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Machakos' },
  { id: 'elrc-bungoma', name: 'ELRC Sub-Registry - Bungoma', stationName: 'Bungoma', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Bungoma' },
  { id: 'elrc-garissa', name: 'ELRC Sub-Registry - Garissa', stationName: 'Garissa', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Garissa' },
  { id: 'elrc-meru', name: 'ELRC Sub-Registry - Meru', stationName: 'Meru', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Meru' },
  { id: 'elrc-kisii', name: 'ELRC Sub-Registry - Kisii', stationName: 'Kisii', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Kisii' },
  { id: 'elrc-voi', name: 'ELRC Sub-Registry - Voi', stationName: 'Voi', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Taita Taveta' },
  { id: 'elrc-kitale', name: 'ELRC Sub-Registry - Kitale', stationName: 'Kitale', category: 'Employment and Labour Relations Court (ELRC)', stationType: 'Sub-Registry', countyOrLocation: 'Trans Nzoia' }
];

// 5. MAGISTRATES' COURTS (LAW COURTS) & SPECIALIZED DIVISIONS
const SPECIALIZED_MAGISTRATE_DIVISIONS: KenyaCourtStation[] = [
  { id: 'mc-milimani-comm', name: 'Milimani Commercial Court – Commercial & Civil Division', stationName: 'Milimani Commercial & Civil', category: 'Magistrates\' Courts (Law Courts)', stationType: 'Specialized Division', countyOrLocation: 'Nairobi' },
  { id: 'mc-milimani-family', name: 'Milimani Commercial Court – Family & Divorce Division', stationName: 'Milimani Family & Divorce', category: 'Magistrates\' Courts (Law Courts)', stationType: 'Specialized Division', countyOrLocation: 'Nairobi' },
  { id: 'mc-milimani-anti-corr', name: 'Milimani Anti-Corruption Court', stationName: 'Milimani Anti-Corruption', category: 'Magistrates\' Courts (Law Courts)', stationType: 'Specialized Division', countyOrLocation: 'Nairobi' }
];

const MAGISTRATE_STATIONS_RAW = [
  'Bungoma', 'Webuye', 'Kimilili', 'Sirisia', 'Busia', 'Malaba', 'Port Victoria',
  'Eldoret', 'Moiben', 'Kapsabet', 'Kabiyet', 'Tinderet', 'Iten', 'Embu', 'Runyenjes',
  'Siakago', 'Garissa', 'Daadab', 'Wajir', 'Mandera', 'Homabay', 'Mbita', 'Oyugis',
  'Kendu Bay', 'Ndhiwa', 'Kakamega', 'Mumias', 'Butere', 'Butali', 'Vihiga', 'Hamisi',
  'Kericho', 'Bomet', 'Sotik', 'Kerugoya', 'Baricho', 'Gichugu', 'Wang\'uru', 'Kitale',
  'Lodwar', 'Kakuma', 'Kapenguria', 'Kisii', 'Ogembo', 'Etago', 'Nyamira', 'Keroka',
  'Narok', 'Kilgoris', 'Kisumu', 'Winam', 'Maseno', 'Nyando', 'Tamu', 'Kombewa',
  'Siaya', 'Bondo', 'Ukwala', 'Madiany', 'Kitui', 'Mutomo', 'Mwingi', 'Kyuso',
  'Machakos', 'Kithimani', 'Kangundo', 'Mavoko', 'Wamunyu', 'Makueni', 'Tawa',
  'Kilungu', 'Makindu', 'Kajiado', 'Loitoktok', 'Ngong', 'Malindi', 'Kilifi',
  'Kaloleni', 'Mariakani', 'Garsen', 'Hola', 'Lamu', 'Mpeketoni', 'Meru', 'Nkubu',
  'Maua', 'Tigania', 'Githongo', 'Isiolo', 'Chuka', 'Marimanti', 'Marsabit', 'Moyale',
  'Migori', 'Rongo', 'Kehancha', 'Mombasa', 'Shanzu', 'Nairobi City County Law Courts',
  'Msambweni', 'Kwale', 'Taveta', 'Wundanyi', 'Voi', 'Murang\'a', 'Kangema', 'Kigumo',
  'Kandara', 'Kenol', 'Milimani Law Courts', 'Makadara', 'JKIA', 'Kibera', 'Kahawa',
  'Dagoretti', 'Kiambu', 'Kikuyu', 'Limuru', 'Githunguri', 'Thika', 'Gatundu',
  'Ruiru', 'Kamwangi', 'Nakuru', 'Molo', 'Naivasha', 'Engineer', 'Ol Kalou',
  'Eldama Ravine', 'Kabarnet', 'Nyahururu', 'Nanyuki', 'Rumuruti', 'Maralal',
  'Nyeri', 'Othaya', 'Karatina', 'Mukurwe-ini'
];

const MAGISTRATES_COURTS: KenyaCourtStation[] = [
  ...SPECIALIZED_MAGISTRATE_DIVISIONS,
  ...MAGISTRATE_STATIONS_RAW.map(st => {
    const formattedName = st.includes('Law Courts') || st.includes('Court')
      ? st
      : `${st} Law Courts`;
    return {
      id: `mc-${st.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: formattedName,
      stationName: st,
      category: 'Magistrates\' Courts (Law Courts)' as CourtCategory,
      stationType: 'Trial Station' as const,
      countyOrLocation: st
    };
  })
];

// 6. SMALL CLAIMS COURTS (SCC)
const SCC_STATIONS_RAW = [
  'Milimani (Nairobi)', 'Dagoretti', 'Thika', 'Ruiru', 'Murang\'a', 'Nyeri', 'Nanyuki',
  'Nakuru', 'Naivasha', 'Kericho', 'Kirinyaga (Kerugoya)', 'Eldoret', 'Kitale',
  'Kakuma', 'Kisumu', 'Siaya', 'Busia', 'Malaba', 'Kisii', 'Migori', 'Narok',
  'Kajiado', 'Loitoktok', 'Makindu', 'Mombasa', 'Malindi', 'Taveta', 'Chuka'
];

const SMALL_CLAIMS_COURTS: KenyaCourtStation[] = SCC_STATIONS_RAW.map(st => ({
  id: `scc-${st.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  name: `Small Claims Court - ${st}`,
  stationName: st,
  category: 'Small Claims Court (SCC)',
  stationType: 'Trial Station',
  countyOrLocation: st
}));

// 7. KADHIS' COURTS
const KADHIS_STATIONS_RAW = [
  'Upperhill (Nairobi)', 'Kibera', 'Mombasa', 'Msambweni', 'Kwale', 'Voi',
  'Malindi', 'Kilifi', 'Mariakani', 'Garsen', 'Hola', 'Lamu', 'Witu',
  'Garissa', 'Daadab', 'Wajir', 'Mandera', 'Balambala', 'Elwak', 'Ijara',
  'Modogashe (Sub-Registry)', 'Bura/Fafi (Sub-Registry)', 'Bute', 'Eldas',
  'Habaswein', 'Takaba', 'Isiolo', 'Garbatulla', 'Merti', 'Marsabit', 'Moyale',
  'Meru', 'Kitui', 'Machakos', 'Kajiado', 'Nakuru', 'Nyeri', 'Eldoret',
  'Kakamega', 'Bungoma', 'Kericho'
];

const KADHIS_COURTS: KenyaCourtStation[] = KADHIS_STATIONS_RAW.map(st => ({
  id: `kadhi-${st.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  name: `Kadhis' Court - ${st}`,
  stationName: st,
  category: 'Kadhis\' Court',
  stationType: st.includes('Sub-Registry') ? 'Sub-Registry' : 'Trial Station',
  countyOrLocation: st
}));

// 8. CHILDREN'S COURTS
const CHILDRENS_COURTS: KenyaCourtStation[] = [
  {
    id: 'cc-milimani',
    name: 'Milimani Children\'s Court (Nairobi)',
    stationName: 'Milimani (Nairobi)',
    category: 'Children\'s Court',
    stationType: 'Specialized Division',
    countyOrLocation: 'Nairobi',
    notes: 'Dedicated children court station'
  },
  {
    id: 'cc-tononoka',
    name: 'Tononoka Children\'s Court (Mombasa)',
    stationName: 'Tononoka (Mombasa)',
    category: 'Children\'s Court',
    stationType: 'Specialized Division',
    countyOrLocation: 'Mombasa',
    notes: 'Dedicated children court station'
  }
];

// MASTER AGGREGATED LIST OF ALL KENYA COURTS
export const ALL_KENYA_COURT_STATIONS: KenyaCourtStation[] = [
  ...SUPREME_COURTS,
  ...COURT_OF_APPEAL,
  ...HIGH_COURTS,
  ...ELRC_COURTS,
  ...MAGISTRATES_COURTS,
  ...SMALL_CLAIMS_COURTS,
  ...KADHIS_COURTS,
  ...CHILDRENS_COURTS
];

// All Court Category Summaries with counts
export const KENYA_COURT_CATEGORIES: {
  category: CourtCategory;
  shortLabel: string;
  badgeColor: string;
  description: string;
  count: number;
}[] = [
  {
    category: 'Supreme Court',
    shortLabel: 'Supreme',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-600/70',
    description: 'Apex constitutional and supreme appellate court in Kenya (Article 163).',
    count: SUPREME_COURTS.length
  },
  {
    category: 'Court of Appeal',
    shortLabel: 'Appeal',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-600/70',
    description: 'Permanent stations & sub-registries for appellate jurisdiction.',
    count: COURT_OF_APPEAL.length
  },
  {
    category: 'High Court',
    shortLabel: 'High Court',
    badgeColor: 'bg-blue-950 text-blue-300 border-blue-600/70',
    description: 'Principal regional seats with unlimited original jurisdiction in civil and criminal matters.',
    count: HIGH_COURTS.length
  },
  {
    category: 'Employment and Labour Relations Court (ELRC)',
    shortLabel: 'ELRC',
    badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-600/70',
    description: 'Specialized court with status of High Court for employment & industrial disputes.',
    count: ELRC_COURTS.length
  },
  {
    category: 'Magistrates\' Courts (Law Courts)',
    shortLabel: 'Magistrates',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-600/70',
    description: 'Primary trial courts and specialized magistrate divisions across all counties.',
    count: MAGISTRATES_COURTS.length
  },
  {
    category: 'Small Claims Court (SCC)',
    shortLabel: 'Small Claims',
    badgeColor: 'bg-teal-950 text-teal-300 border-teal-600/70',
    description: 'Expedited dispute resolution for claims up to statutory threshold.',
    count: SMALL_CLAIMS_COURTS.length
  },
  {
    category: 'Kadhis\' Court',
    shortLabel: 'Kadhis',
    badgeColor: 'bg-lime-950 text-lime-300 border-lime-600/70',
    description: 'Constitutional courts determining questions of Muslim law relating to personal status, marriage, divorce, and inheritance.',
    count: KADHIS_COURTS.length
  },
  {
    category: 'Children\'s Court',
    shortLabel: 'Children',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-600/70',
    description: 'Specialized stations and designated magistrates dealing with care, protection & custody of minors.',
    count: CHILDRENS_COURTS.length
  }
];

// Helper: Get list of all distinct court names
export const getAllKenyaCourtNames = (): string[] => {
  return Array.from(new Set(ALL_KENYA_COURT_STATIONS.map(c => c.name)));
};

// Default standard court list for Initial Settings / Firm initialization
export const DEFAULT_KENYA_COURT_STATIONS = getAllKenyaCourtNames();

// Helper to look up a court station details
export const findKenyaCourtByName = (name: string): KenyaCourtStation | undefined => {
  if (!name) return undefined;
  return ALL_KENYA_COURT_STATIONS.find(
    c => c.name.toLowerCase() === name.toLowerCase() ||
         c.stationName.toLowerCase() === name.toLowerCase()
  );
};

// Helper: Get category of a court name
export const getCourtCategoryByName = (name: string): CourtCategory => {
  const court = findKenyaCourtByName(name);
  if (court) return court.category;

  // Heuristics for custom or unlisted station names
  const lower = name.toLowerCase();
  if (lower.includes('supreme')) return 'Supreme Court';
  if (lower.includes('appeal') || lower.includes('coa')) return 'Court of Appeal';
  if (lower.includes('high court') || lower.includes('hccc')) return 'High Court';
  if (lower.includes('elrc') || lower.includes('labour') || lower.includes('employment')) return 'Employment and Labour Relations Court (ELRC)';
  if (lower.includes('small claims') || lower.includes('scc')) return 'Small Claims Court (SCC)';
  if (lower.includes('kadhi')) return 'Kadhis\' Court';
  if (lower.includes('children') || lower.includes('minor')) return 'Children\'s Court';
  return 'Magistrates\' Courts (Law Courts)';
};
