// Local storage management for language learning app

export interface SavedText {
  id: string;
  title: string;
  date: string;
  originalText: string;
}

export interface ExerciseSet {
  id: string;
  textId: string; // linked text
  words: string[]; // target words/expressions
  questions: Array<{ q: string; a?: string }>;
  savedAt: string;
}

export interface WeeklyGoal {
  id: string;
  text: string;
  completed?: boolean;
  createdAt: string;
}

export interface VocabEntry {
  id: string;
  text: string;
  type: "word" | "sentence";
  context?: string;
  ipa: string;
  translation: string;
  notes: string;
  addedAt: string;
  audioUrl?: string;
  examples: string[];
  tags: string[];
  textId?: string; // Link to the text this vocab came from
  usageCount?: number;
  // historical usage by date (ISO yyyy-mm-dd -> count)
  usageHistory?: { [date: string]: number };
}

export interface PdfPath {
  id: string;
  path: string;
  name: string;
  addedAt: string;
}

export interface TongueTwister {
  id: string;
  text: string;
  focus: string[];
  ipa: string;
  difficulty: number;
  notes: string;
  examples: string[];
  practiced?: boolean;
}

export interface AppData {
  texts: SavedText[];
  vocab: VocabEntry[];
  tongueTwisters: TongueTwister[];
  pdfPaths: PdfPath[];
  exercises: ExerciseSet[];
  goals: WeeklyGoal[];
  tags: string[];  // Global list of vocabulary tags
  settings: {
    fontSize: number;
    theme: "light" | "dark" | "system";
    geminiApiKey: string;
  };
}

const STORAGE_KEY = "langapp_v1";

export const getAppData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored data:", e);
    }
  }
  return getDefaultData();
};

export const saveAppData = (data: AppData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const exportData = (): string => {
  return JSON.stringify(getAppData(), null, 2);
};

export const exportVocabCSV = (): string => {
  const data = getAppData();
  // Export only the user-facing fields requested: text, ipa, translation, notes, examples
  const headers = [
    'text',
    'ipa',
    'translation',
    'notes',
    'examples',
  ];

  const escape = (value: any) => {
    if (value === null || value === undefined) return '""';
    const s = typeof value === 'string' ? value : String(value);
    // double-up quotes per CSV rules
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const rows: string[] = [];
  rows.push(headers.join(','));

  data.vocab.forEach((v) => {
    const examples = Array.isArray(v.examples) ? v.examples.join(' | ') : '';

    const row = [
      escape(v.text),
      escape(v.ipa || ''),
      escape(v.translation || ''),
      escape(v.notes || ''),
      escape(examples),
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
};

export const exportVocabHTML = (): string => {
  const data = getAppData();

  const escapeHtml = (unsafe: any) => {
    if (unsafe === null || unsafe === undefined) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const rows = data.vocab.map((v) => {
    const examples = Array.isArray(v.examples) ? v.examples.map(e => escapeHtml(e)).join('<br/>') : '';
    return `
      <tr>
        <td class="cell">${escapeHtml(v.text)}</td>
        <td class="cell">${escapeHtml(v.ipa || '')}</td>
        <td class="cell">${escapeHtml(v.translation || '')}</td>
        <td class="cell">${escapeHtml(v.notes || '')}</td>
        <td class="cell">${examples}</td>
      </tr>`;
  }).join('\n');

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>LangLearn Vocabulary Export</title>
    <style>
      body{font-family:Inter,system-ui,Arial,Helvetica,sans-serif;margin:20px;color:#111}
      h1{font-size:20px;margin-bottom:6px}
      p{color:#555;margin-top:0;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      thead th{background:#f3f4f6;padding:10px;border:1px solid #e5e7eb;text-align:left}
      .cell{padding:10px;border:1px solid #e5e7eb;vertical-align:top}
      tbody tr:nth-child(even){background:#fbfbfb}
      .examples{white-space:pre-wrap}
      @media print{ body{margin:0} thead th{background:#eee !important} }
    </style>
  </head>
  <body>
    <h1>Vocabulary Export</h1>
    <p>Exported from LangLearn — ${new Date().toLocaleString()}</p>
    <table>
      <thead>
        <tr>
          <th>Text</th>
          <th>IPA</th>
          <th>Translation</th>
          <th>Notes</th>
          <th>Examples</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </body>
  </html>`;

  return html;
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    saveAppData(data);
    return true;
  } catch (e) {
    console.error("Failed to import data:", e);
    return false;
  }
};

export const resetData = (): void => {
  saveAppData(getDefaultData());
};

const getDefaultData = (): AppData => ({
  texts: [],
  vocab: [],
  tongueTwisters: getDefaultTongueTwisters(),
  pdfPaths: [],
  exercises: [],
  goals: [],
  tags: [], // Initialize empty tags array
  settings: {
    fontSize: 16,
    theme: "system",
    geminiApiKey: "AIzaSyAg9vO1uRjzQxuIdVJcW-13-GL8AKVhl6I",
  },
});

const getDefaultTongueTwisters = (): TongueTwister[] => [
  {
    id: "tt1",
    text: "She sells seashells by the seashore.\nThe shells she sells are surely seashells.\nSo if she sells shells on the seashore, I'm sure she sells seashore shells.",
    ipa: "ʃiː sɛlz ˈsiːʃɛlz baɪ ðə ˈsiːʃɔːr / ðə ʃɛlz ʃiː sɛlz ɑːr ˈʃʊrli ˈsiːʃɛlz / soʊ ɪf ʃiː sɛlz ʃɛlz ɒn ðə ˈsiːʃɔːr aɪm ʃʊr ʃiː sɛlz ˈsiːʃɔːr ʃɛlz",
    focus: ["ʃ", "s"],
    difficulty: 3,
    notes: "Practice at a slow speed, increase tempo",
    examples: [],
  },
  {
    id: "tt2",
    text: "Peter Piper picked a peck of pickled peppers.\nA peck of pickled peppers Peter Piper picked.\nIf Peter Piper picked a peck of pickled peppers, where's the peck of pickled peppers Peter Piper picked?",
    ipa: "ˈpiːtər ˈpaɪpər pɪkt ə pɛk əv ˈpɪkəld ˈpɛpərz / ə pɛk əv ˈpɪkəld ˈpɛpərz ˈpiːtər ˈpaɪpər pɪkt / ɪf ˈpiːtər ˈpaɪpər pɪkt ə pɛk əv ˈpɪkəld ˈpɛpərz wɛərz ðə pɛk əv ˈpɪkəld ˈpɛpərz ˈpiːtər ˈpaɪpər pɪkt",
    focus: ["p"],
    difficulty: 4,
    notes: "Focus on crisp P sounds",
    examples: [],
  },
  {
    id: "tt3",
    text: "How can a clam cram in a clean cream can?\nIf a clam can cram in a clean cream can,\nthen why can't a clam cram in a clam cream can?",
    ipa: "haʊ kæn ə klæm kræm ɪn ə kliːn kriːm kæn / ɪf ə klæm kæn kræm ɪn ə kliːn kriːm kæn / ðɛn waɪ kɑːnt ə klæm kræm ɪn ə klæm kriːm kæn",
    focus: ["k", "l"],
    difficulty: 3,
    notes: "Watch the CL cluster",
    examples: [],
  },
  {
    id: "tt4",
    text: "I scream, you scream, we all scream for ice cream.\nScreaming for ice cream in the summer heat,\nSweet cream dreams on every street.",
    ipa: "aɪ skriːm juː skriːm wiː ɔːl skriːm fɔːr aɪs kriːm / ˈskriːmɪŋ fɔːr aɪs kriːm ɪn ðə ˈsʌmər hiːt / swiːt kriːm driːmz ɒn ˈɛvri striːt",
    focus: ["s", "k", "r"],
    difficulty: 2,
    notes: "Clear vowel transitions",
    examples: [],
  },
  {
    id: "tt5",
    text: "The thirty-three thieves thought that they thrilled the throne throughout Thursday.\nThey threw things through thick and thin,\nThinking Thursday would be their win.",
    ipa: "ðə ˈθɜːrti θriː θiːvz θɔːt ðæt ðeɪ θrɪld ðə θroʊn θruːˈaʊt ˈθɜːrzdeɪ / ðeɪ θruː θɪŋz θruː θɪk ænd θɪn / ˈθɪŋkɪŋ ˈθɜːrzdeɪ wʊd biː ðɛər wɪn",
    focus: ["θ", "ð"],
    difficulty: 5,
    notes: "TH sounds - most challenging",
    examples: [],
  },
  {
    id: "tt6",
    text: "Red lorry, yellow lorry, red lorry, yellow lorry.\nRolling down the road all day,\nLorries carrying loads away.",
    ipa: "rɛd ˈlɒri ˈjɛloʊ ˈlɒri rɛd ˈlɒri ˈjɛloʊ ˈlɒri / ˈroʊlɪŋ daʊn ðə roʊd ɔːl deɪ / ˈlɒriz ˈkæriɪŋ loʊdz əˈweɪ",
    focus: ["r", "l"],
    difficulty: 4,
    notes: "R and L distinction",
    examples: [],
  },
  {
    id: "tt7",
    text: "Which wristwatches are Swiss wristwatches?\nSwiss wristwatches tick with Swiss precision,\nWatching wrists with watchful vision.",
    ipa: "wɪtʃ ˈrɪstˌwɒtʃɪz ɑːr swɪs ˈrɪstˌwɒtʃɪz / swɪs ˈrɪstˌwɒtʃɪz tɪk wɪð swɪs prɪˈsɪʒən / ˈwɒtʃɪŋ rɪsts wɪð ˈwɒtʃfəl ˈvɪʒən",
    focus: ["w", "tʃ", "s"],
    difficulty: 4,
    notes: "Complex consonant clusters",
    examples: [],
  },
  {
    id: "tt8",
    text: "Six thick thistle sticks.\nThick thistles stick together tight,\nSticking through the day and night.",
    ipa: "sɪks θɪk ˈθɪsəl stɪks / θɪk ˈθɪsəlz stɪk təˈɡɛðər taɪt / ˈstɪkɪŋ θruː ðə deɪ ænd naɪt",
    focus: ["θ", "s"],
    difficulty: 3,
    notes: "TH and S combination",
    examples: [],
  },
  {
    id: "tt9",
    text: "Betty Botter bought some butter but the butter was bitter.\nSo Betty Botter bought some better butter,\nTo make the bitter butter better.",
    ipa: "ˈbɛti ˈbɒtər bɔːt səm ˈbʌtər bʌt ðə ˈbʌtər wəz ˈbɪtər / soʊ ˈbɛti ˈbɒtər bɔːt səm ˈbɛtər ˈbʌtər / tə meɪk ðə ˈbɪtər ˈbʌtər ˈbɛtər",
    focus: ["b", "t"],
    difficulty: 3,
    notes: "B and T plosives",
    examples: [],
  },
  {
    id: "tt10",
    text: "I saw a kitten eating chicken in the kitchen.",
    ipa: "aɪ sɔː ə ˈkɪtən ˈiːtɪŋ ˈtʃɪkən ɪn ðə ˈkɪtʃən",
    focus: ["ɪ", "tʃ"],
    difficulty: 2,
    notes: "Short I and CH sounds",
    examples: [],
  },
  {
    id: "tt11",
    text: "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.",
    ipa: "ˈfʌzi ˈwʌzi wəz ə bɛər ˈfʌzi ˈwʌzi hæd noʊ hɛər",
    focus: ["f", "w", "z"],
    difficulty: 2,
    notes: "F, W, and Z sounds",
    examples: [],
  },
  {
    id: "tt12",
    text: "A proper copper coffee pot.",
    ipa: "ə ˈprɒpər ˈkɒpər ˈkɒfi pɒt",
    focus: ["p", "k"],
    difficulty: 3,
    notes: "P and K alternation",
    examples: [],
  },
  {
    id: "tt13",
    text: "Around the rugged rock the ragged rascal ran.",
    ipa: "əˈraʊnd ðə ˈrʌɡɪd rɒk ðə ˈræɡɪd ˈræskəl ræn",
    focus: ["r", "æ"],
    difficulty: 4,
    notes: "Multiple R sounds",
    examples: [],
  },
  {
    id: "tt14",
    text: "Fred fed Ted bread and Ted fed Fred bread.",
    ipa: "frɛd fɛd tɛd brɛd ænd tɛd fɛd frɛd brɛd",
    focus: ["f", "t", "d"],
    difficulty: 3,
    notes: "Short E vowel",
    examples: [],
  },
  {
    id: "tt15",
    text: "Lesser leather never weathered wetter weather better.",
    ipa: "ˈlɛsər ˈlɛðər ˈnɛvər ˈwɛðərd ˈwɛtər ˈwɛðər ˈbɛtər",
    focus: ["ð", "w", "ɛ"],
    difficulty: 5,
    notes: "TH voiced and unvoiced",
    examples: [],
  },
  {
    id: "tt16",
    text: "Eleven benevolent elephants.",
    ipa: "ɪˈlɛvən bəˈnɛvələnt ˈɛlɪfənts",
    focus: ["ɛ", "l"],
    difficulty: 2,
    notes: "Short E practice",
    examples: [],
  },
  {
    id: "tt17",
    text: "Nine nice night nurses nursing nicely.",
    ipa: "naɪn naɪs naɪt ˈnɜːrsɪz ˈnɜːrsɪŋ ˈnaɪsli",
    focus: ["n", "aɪ"],
    difficulty: 3,
    notes: "N and long I",
    examples: [],
  },
  {
    id: "tt18",
    text: "Can you can a can as a canner can can a can?",
    ipa: "kæn juː kæn ə kæn æz ə ˈkænər kæn kæn ə kæn",
    focus: ["k", "æ"],
    difficulty: 4,
    notes: "Short A vowel",
    examples: [],
  },
  {
    id: "tt19",
    text: "The big black bug bit the big black bear.",
    ipa: "ðə bɪɡ blæk bʌɡ bɪt ðə bɪɡ blæk bɛər",
    focus: ["b", "ɡ"],
    difficulty: 2,
    notes: "B and G sounds",
    examples: [],
  },
  {
    id: "tt20",
    text: "Freshly fried fresh flesh.",
    ipa: "ˈfrɛʃli fraɪd frɛʃ flɛʃ",
    focus: ["f", "r", "ʃ"],
    difficulty: 4,
    notes: "FR and SH clusters",
    examples: [],
  },
  {
    id: "tt21",
    text: "Greek grapes, Greek grapes, Greek grapes.",
    ipa: "ɡriːk ɡreɪps ɡriːk ɡreɪps ɡriːk ɡreɪps",
    focus: ["ɡ", "r"],
    difficulty: 3,
    notes: "GR cluster",
    examples: [],
  },
  {
    id: "tt22",
    text: "Three free throws.",
    ipa: "θriː friː θroʊz",
    focus: ["θ", "f", "r"],
    difficulty: 3,
    notes: "TH and FR",
    examples: [],
  },
  {
    id: "tt23",
    text: "Daddy draws doors. Daddy draws doors. Daddy draws doors.",
    ipa: "ˈdædi drɔːz dɔːrz ˈdædi drɔːz dɔːrz ˈdædi drɔːz dɔːrz",
    focus: ["d", "r"],
    difficulty: 2,
    notes: "D and R combination",
    examples: [],
  },
  {
    id: "tt24",
    text: "Toy boat, toy boat, toy boat.",
    ipa: "tɔɪ boʊt tɔɪ boʊt tɔɪ boʊt",
    focus: ["t", "b", "ɔɪ"],
    difficulty: 3,
    notes: "OI diphthong",
    examples: [],
  },
  {
    id: "tt25",
    text: "Sheila needs fleece to freeze three sheep.",
    ipa: "ˈʃiːlə niːdz fliːs tə friːz θriː ʃiːp",
    focus: ["ʃ", "f", "iː"],
    difficulty: 4,
    notes: "Long E sounds",
    examples: [],
  },
  {
    id: "tt26",
    text: "Cooks cook cupcakes quickly.",
    ipa: "kʊks kʊk ˈkʌpkeɪks ˈkwɪkli",
    focus: ["k", "ʊ"],
    difficulty: 2,
    notes: "Short U sounds",
    examples: [],
  },
  {
    id: "tt27",
    text: "Vincent vowed vengeance very vehemently.",
    ipa: "ˈvɪnsənt vaʊd ˈvɛndʒəns ˈvɛri ˈviːəməntli",
    focus: ["v"],
    difficulty: 3,
    notes: "V sound practice",
    examples: [],
  },
  {
    id: "tt28",
    text: "Wayne went to Wales to watch walruses.",
    ipa: "weɪn wɛnt tə weɪlz tə wɒtʃ ˈwɔːlrəsɪz",
    focus: ["w"],
    difficulty: 2,
    notes: "W sound",
    examples: [],
  },
  {
    id: "tt29",
    text: "Six sleek swans swam swiftly southwards.",
    ipa: "sɪks sliːk swɒnz swæm ˈswɪftli ˈsaʊθwərdz",
    focus: ["s", "w"],
    difficulty: 4,
    notes: "SW cluster",
    examples: [],
  },
  {
    id: "tt30",
    text: "Imagine an imaginary menagerie manager managing an imaginary menagerie.",
    ipa: "ɪˈmædʒɪn æn ɪˈmædʒɪnɛri məˈnædʒəri ˈmænɪdʒər ˈmænɪdʒɪŋ æn ɪˈmædʒɪnɛri məˈnædʒəri",
    focus: ["dʒ", "m"],
    difficulty: 5,
    notes: "Complex J sounds",
    examples: [],
  },
  {
    id: "tt31",
    text: "I thought a thought but the thought I thought wasn't the thought I thought I thought.",
    ipa: "aɪ θɔːt ə θɔːt bʌt ðə θɔːt aɪ θɔːt ˈwɒzənt ðə θɔːt aɪ θɔːt aɪ θɔːt",
    focus: ["θ", "ɔː"],
    difficulty: 5,
    notes: "TH and thought",
    examples: [],
  },
  {
    id: "tt32",
    text: "Ann and Andy's anniversary is in April.",
    ipa: "æn ænd ˈændiːz ˌænɪˈvɜːrsəri ɪz ɪn ˈeɪprəl",
    focus: ["æ", "n"],
    difficulty: 2,
    notes: "Short A sounds",
    examples: [],
  },
  {
    id: "tt33",
    text: "Susie works in a shoeshine shop. Where she shines she sits, and where she sits she shines.",
    ipa: "ˈsuːzi wɜːrks ɪn ə ˈʃuːʃaɪn ʃɒp wɛər ʃiː ʃaɪnz ʃiː sɪts ænd wɛər ʃiː sɪts ʃiː ʃaɪnz",
    focus: ["ʃ", "s"],
    difficulty: 5,
    notes: "SH and S distinction",
    examples: [],
  },
  {
    id: "tt34",
    text: "Unique New York, unique New York, unique New York.",
    ipa: "juːˈniːk njuː jɔːrk juːˈniːk njuː jɔːrk juːˈniːk njuː jɔːrk",
    focus: ["j", "uː"],
    difficulty: 4,
    notes: "Y sound",
    examples: [],
  },
  {
    id: "tt35",
    text: "Real rock wall, real rock wall, real rock wall.",
    ipa: "rɪəl rɒk wɔːl rɪəl rɒk wɔːl rɪəl rɒk wɔːl",
    focus: ["r", "w"],
    difficulty: 3,
    notes: "R and W combo",
    examples: [],
  },
  {
    id: "tt36",
    text: "Zebras zig and zebras zag.",
    ipa: "ˈziːbrəz zɪɡ ænd ˈziːbrəz zæɡ",
    focus: ["z", "ɡ"],
    difficulty: 2,
    notes: "Z sound",
    examples: [],
  },
  {
    id: "tt37",
    text: "He threw three free throws.",
    ipa: "hiː θruː θriː friː θroʊz",
    focus: ["θ", "r"],
    difficulty: 4,
    notes: "THR cluster",
    examples: [],
  },
  {
    id: "tt38",
    text: "The queen in green screamed.",
    ipa: "ðə kwiːn ɪn ɡriːn skriːmd",
    focus: ["kw", "iː"],
    difficulty: 2,
    notes: "Long E and QU",
    examples: [],
  },
  {
    id: "tt39",
    text: "Twelve twins twirled twelve twigs.",
    ipa: "twɛlv twɪnz twɜːrld twɛlv twɪɡz",
    focus: ["tw"],
    difficulty: 3,
    notes: "TW cluster",
    examples: [],
  },
  {
    id: "tt40",
    text: "A big bug bit the little beetle but the little beetle bit the big bug back.",
    ipa: "ə bɪɡ bʌɡ bɪt ðə ˈlɪtəl ˈbiːtəl bʌt ðə ˈlɪtəl ˈbiːtəl bɪt ðə bɪɡ bʌɡ bæk",
    focus: ["b", "t", "l"],
    difficulty: 4,
    notes: "B, T, L sounds",
    examples: [],
  },
  {
    id: "tt41",
    text: "Pirates' private property.",
    ipa: "ˈpaɪrəts ˈpraɪvət ˈprɒpərti",
    focus: ["p", "r", "aɪ"],
    difficulty: 3,
    notes: "PR cluster",
    examples: [],
  },
  {
    id: "tt42",
    text: "The boot black brought the black boot back.",
    ipa: "ðə buːt blæk brɔːt ðə blæk buːt bæk",
    focus: ["b", "k"],
    difficulty: 3,
    notes: "BL and B sounds",
    examples: [],
  },
  {
    id: "tt43",
    text: "Specific Pacific fish species.",
    ipa: "spəˈsɪfɪk pəˈsɪfɪk fɪʃ ˈspiːʃiːz",
    focus: ["s", "f", "ʃ"],
    difficulty: 4,
    notes: "S, F, SH practice",
    examples: [],
  },
  {
    id: "tt44",
    text: "Selfish shellfish smell fish.",
    ipa: "ˈsɛlfɪʃ ˈʃɛlfɪʃ smɛl fɪʃ",
    focus: ["ʃ", "f", "s"],
    difficulty: 3,
    notes: "SH, F, S sounds",
    examples: [],
  },
  {
    id: "tt45",
    text: "Give papa a cup of proper coffee in a copper coffee cup.",
    ipa: "ɡɪv ˈpɑːpɑː ə kʌp əv ˈprɒpər ˈkɒfi ɪn ə ˈkɒpər ˈkɒfi kʌp",
    focus: ["p", "k"],
    difficulty: 4,
    notes: "P and K combo",
    examples: [],
  },
];
