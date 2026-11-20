/**
 * Classroom word lists and letter tables for Settings > Letters.
 *
 * Sources (short, classroom-appropriate words):
 * - Sight Words: Dolch pre-primer–2nd + nouns, Fry Instant Words 1–300
 *   (ReadWriteThink, Mrs. Perkins, Lakeshore Learning).
 * - Short Vowels / CVC and short-vowel sounds: We Are Teachers CVC word-family list,
 *   minus uncommon padding words.
 * - Word Families: classic –at, –an, –ig, –op, –ug families.
 * - Blends & Digraphs and Sound focus: common K–2 phonics words containing
 *   the pattern (vowel teams, r-controlled, digraphs, blends, magic e), up to 5 letters.
 *   Curated in /workspace/wordblitz_classic_v2/soundfocus/curate.py; top20 ordered by wordfreq.
 */

/**
 * Longest word allowed in a Sound focus list. The game itself has no length cap
 * (the dictionary goes up to 22 letters); lists stay short so K-2 kids can spell them.
 */
export const SOUND_FOCUS_MAX_WORD_LENGTH = 5;

export const SOUND_FOCUS_IDS = [
  'oo', 'ee', 'ea', 'ai', 'ay', 'oa', 'ow', 'ou', 'ar', 'or', 'er', 'sh', 'ch', 'th', 'wh', 'ck', 'ng', 'bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'tr', 'sp', 'st', 'sw', '-nd', '-nk', '-nt', '-mp', '-st', 'short-a', 'short-e', 'short-i', 'short-o', 'short-u', 'a-e', 'i-e', 'o-e', 'u-e',
] as const;

export type SoundFocusId = (typeof SOUND_FOCUS_IDS)[number];

export const LETTER_PRESET_IDS = ['standard', 'sight', 'cvc', 'families', 'blends'] as const;
export type LetterPresetId = (typeof LETTER_PRESET_IDS)[number];

export type WeightMap = Partial<Record<string, number>>;

export interface SoundFocusDef {
  id: SoundFocusId;
  label: string;
  group: string;
  /** Every word with the pattern (seed words + group membership fallback). */
  words: readonly string[];
  /**
   * The focus's most common words, most frequent first (wordfreq Zipf, en),
   * classroom-appropriate and <= SOUND_FOCUS_MAX_WORD_LENGTH letters.
   * Letter weights are calculated from this list (see letterDistributions.ts).
   */
  top20: readonly string[];
}

export const SOUND_GROUPS: { label: string; ids: SoundFocusId[] }[] = [
  { label: 'Vowel teams', ids: ['oo', 'ee', 'ea', 'ai', 'ay', 'oa', 'ow', 'ou'] },
  { label: 'R-controlled', ids: ['ar', 'or', 'er'] },
  { label: 'Digraphs', ids: ['sh', 'ch', 'th', 'wh', 'ck', 'ng'] },
  { label: 'Initial blends', ids: ['bl', 'cl', 'fl', 'gl', 'pl', 'sl', 'br', 'cr', 'dr', 'fr', 'gr', 'tr', 'sp', 'st', 'sw'] },
  { label: 'Final blends', ids: ['-nd', '-nk', '-nt', '-mp', '-st'] },
  { label: 'Short vowels', ids: ['short-a', 'short-e', 'short-i', 'short-o', 'short-u'] },
  { label: 'Magic e', ids: ['a-e', 'i-e', 'o-e', 'u-e'] },
];

export const SOUND_SEED_CHANCE = 0.4;

/** Words shown as examples for a focus: its 10 most common words. */
export function soundFocusSamples(id: SoundFocusId): readonly string[] {
  return SOUND_FOCUS[id].top20.slice(0, 10);
}

export const SOUND_FOCUS: Record<SoundFocusId, SoundFocusDef> = {
  'oo': {
    id: 'oo',
    label: 'oo',
    group: 'Vowel teams',
    words: ['TOO', 'ZOO', 'MOO', 'BOO', 'COO', 'GOO', 'WOO', 'FOOD', 'MOON', 'BOOK', 'LOOK', 'COOK', 'TOOK', 'GOOD', 'WOOD', 'HOOD', 'FOOT', 'COOL', 'POOL', 'TOOL', 'LOOP', 'HOOP', 'ROOM', 'BOOT', 'ROOT', 'SOON', 'NOON', 'ROOF', 'WOOL', 'BOOM', 'ZOOM', 'MOOD', 'POOR', 'DOOR', 'HOOK', 'NOOK', 'COOP', 'HOOT', 'HOOF', 'SOOT'],
    top20: ['GOOD', 'TOO', 'LOOK', 'TOOK', 'BOOK', 'FOOD', 'ROOM', 'SOON', 'COOL', 'POOR', 'DOOR', 'FOOT', 'WOOD', 'MOON', 'POOL', 'COOK', 'TOOL', 'ROOF', 'MOOD', 'ROOT'],
  },
  'ee': {
    id: 'ee',
    label: 'ee',
    group: 'Vowel teams',
    words: ['SEE', 'BEE', 'FEE', 'TEE', 'WEE', 'SEED', 'NEED', 'FEED', 'DEED', 'REED', 'WEED', 'FEET', 'MEET', 'BEEN', 'SEEN', 'DEER', 'KEEN', 'KEEP', 'DEEP', 'BEEP', 'PEEK', 'WEEK', 'SEEK', 'SEEM', 'FEEL', 'HEEL', 'PEEL', 'REEL', 'TEEN', 'TREE', 'FREE', 'BEEF', 'REEF', 'PEEP', 'JEEP', 'WEEP'],
    top20: ['BEEN', 'SEE', 'NEED', 'FEEL', 'KEEP', 'FREE', 'WEEK', 'SEEN', 'MEET', 'SEEM', 'DEEP', 'FEET', 'TREE', 'FEED', 'SEEK', 'FEE', 'SEED', 'TEEN', 'BEEF', 'WEED'],
  },
  'ea': {
    id: 'ea',
    label: 'ea',
    group: 'Vowel teams',
    words: ['EAT', 'SEA', 'TEA', 'PEA', 'EAR', 'LEAF', 'READ', 'LEAD', 'BEAT', 'MEAT', 'SEAT', 'HEAT', 'NEAT', 'FLEA', 'PLEA', 'BEAN', 'LEAN', 'MEAN', 'DEAR', 'FEAR', 'NEAR', 'YEAR', 'HEAR', 'PEAR', 'WEAR', 'TEAR', 'BEAK', 'LEAK', 'PEAK', 'WEAK', 'TEAM', 'BEAM', 'SEAM', 'HEAL', 'MEAL', 'REAL', 'EACH', 'EAST', 'HEAD', 'DEAD', 'DEAF', 'LEAP'],
    top20: ['YEAR', 'EACH', 'TEAM', 'REAL', 'READ', 'MEAN', 'HEAD', 'NEAR', 'HEAR', 'LEAD', 'DEAD', 'EAST', 'EAT', 'SEA', 'BEAT', 'FEAR', 'WEAR', 'HEAT', 'SEAT', 'DEAR'],
  },
  'ai': {
    id: 'ai',
    label: 'ai',
    group: 'Vowel teams',
    words: ['AID', 'AIM', 'AIR', 'RAIN', 'PAID', 'LAID', 'MAID', 'WAIT', 'BAIT', 'TAIL', 'SAIL', 'FAIL', 'NAIL', 'PAIL', 'RAIL', 'JAIL', 'MAIL', 'PAIN', 'MAIN', 'GAIN', 'VAIN', 'FAIR', 'HAIR', 'PAIR', 'SAID'],
    top20: ['SAID', 'AIR', 'WAIT', 'MAIN', 'PAID', 'HAIR', 'PAIN', 'FAIR', 'GAIN', 'AID', 'MAIL', 'PAIR', 'RAIN', 'JAIL', 'FAIL', 'LAID', 'AIM', 'RAIL', 'TAIL', 'NAIL'],
  },
  'ay': {
    id: 'ay',
    label: 'ay',
    group: 'Vowel teams',
    words: ['DAY', 'SAY', 'MAY', 'WAY', 'PAY', 'LAY', 'BAY', 'HAY', 'JAY', 'RAY', 'PLAY', 'STAY', 'TRAY', 'CLAY', 'PRAY', 'GRAY', 'GREY', 'AWAY', 'SWAY', 'OKAY', 'TODAY', 'SPRAY'],
    top20: ['WAY', 'MAY', 'DAY', 'SAY', 'AWAY', 'PLAY', 'TODAY', 'PAY', 'STAY', 'OKAY', 'BAY', 'RAY', 'LAY', 'GREY', 'GRAY', 'PRAY', 'JAY', 'CLAY', 'SPRAY', 'HAY'],
  },
  'oa': {
    id: 'oa',
    label: 'oa',
    group: 'Vowel teams',
    words: ['OAT', 'OAK', 'OAR', 'BOA', 'BOAT', 'COAT', 'GOAT', 'MOAT', 'ROAD', 'LOAD', 'TOAD', 'SOAP', 'FOAM', 'LOAN', 'MOAN', 'GOAL', 'COAL', 'FOAL', 'SOAK', 'ROAM', 'BOAST', 'TOAST', 'COAST', 'FLOAT'],
    top20: ['ROAD', 'GOAL', 'COAST', 'BOAT', 'LOAN', 'LOAD', 'COAL', 'COAT', 'OAK', 'SOAP', 'GOAT', 'TOAST', 'FLOAT', 'FOAM', 'SOAK', 'BOAST', 'ROAM', 'MOAN', 'TOAD', 'BOA'],
  },
  'ow': {
    id: 'ow',
    label: 'ow',
    group: 'Vowel teams',
    words: ['COW', 'HOW', 'NOW', 'WOW', 'BOW', 'LOW', 'ROW', 'MOW', 'TOW', 'SOW', 'OWN', 'OWL', 'DOWN', 'TOWN', 'GOWN', 'SNOW', 'GROW', 'BLOW', 'SLOW', 'FLOW', 'SHOW', 'KNOW', 'CROW', 'BOWL'],
    top20: ['HOW', 'NOW', 'KNOW', 'DOWN', 'OWN', 'SHOW', 'LOW', 'TOWN', 'WOW', 'GROW', 'SLOW', 'FLOW', 'SNOW', 'BOWL', 'ROW', 'BLOW', 'BOW', 'COW', 'OWL', 'CROW'],
  },
  'ou': {
    id: 'ou',
    label: 'ou',
    group: 'Vowel teams',
    words: ['OUT', 'OUR', 'YOU', 'LOUD', 'FOUR', 'YOUR', 'POUR', 'SOUR', 'HOUR', 'SOUP', 'BOUT', 'POUT', 'NOUN', 'FOUL', 'OUCH', 'SOUL', 'CLOUD', 'HOUSE', 'MOUSE', 'ROUND', 'SOUND', 'FOUND', 'MOUTH', 'SHOUT', 'COUCH', 'COUNT', 'PROUD', 'SCOUT'],
    top20: ['OUT', 'OUR', 'HOUSE', 'FOUND', 'HOUR', 'SOUND', 'ROUND', 'MOUTH', 'COUNT', 'PROUD', 'LOUD', 'CLOUD', 'MOUSE', 'COUCH', 'SOUP', 'SHOUT', 'BOUT', 'FOUL', 'SCOUT', 'SOUR'],
  },
  'ar': {
    id: 'ar',
    label: 'ar',
    group: 'R-controlled',
    words: ['CAR', 'FAR', 'BAR', 'JAR', 'TAR', 'ARM', 'ART', 'ARE', 'ARK', 'WAR', 'STAR', 'HARD', 'YARD', 'CARD', 'PARK', 'DARK', 'MARK', 'BARK', 'FARM', 'HARM', 'BARN', 'YARN', 'PART', 'CART', 'DART', 'MART', 'TART', 'HARP', 'WARM', 'SCAR', 'ARCH'],
    top20: ['ARE', 'PART', 'HARD', 'FAR', 'WAR', 'CAR', 'ART', 'STAR', 'PARK', 'MARK', 'CARD', 'DARK', 'BAR', 'FARM', 'ARM', 'WARM', 'YARD', 'HARM', 'ARCH', 'BARN'],
  },
  'or': {
    id: 'or',
    label: 'or',
    group: 'R-controlled',
    words: ['FOR', 'ORE', 'BORN', 'CORN', 'HORN', 'TORN', 'WORN', 'FORK', 'PORK', 'CORK', 'FORT', 'PORT', 'SORT', 'MORE', 'SORE', 'CORE', 'TORE', 'WORE', 'CORD', 'FORD', 'LORD', 'WORD', 'WORK', 'WORM', 'FORM', 'NORM'],
    top20: ['FOR', 'MORE', 'FORM', 'LORD', 'BORN', 'SORT', 'PORT', 'CORE', 'FORD', 'FORT', 'WORN', 'CORN', 'HORN', 'ORE', 'TORN', 'FORK', 'PORK', 'SORE', 'CORD', 'NORM'],
  },
  'er': {
    id: 'er',
    label: 'er / ir / ur',
    group: 'R-controlled',
    words: ['HER', 'FERN', 'HERD', 'TERM', 'PERM', 'VERB', 'WERE', 'HERS', 'PERK', 'GERM', 'BIRD', 'GIRL', 'DIRT', 'FIRM', 'SIR', 'STIR', 'FIR', 'FUR', 'BURN', 'TURN', 'HURT', 'CURL', 'PURR', 'CURB', 'SURF', 'TURF', 'BLUR', 'CURE', 'PURE', 'SURE'],
    top20: ['WERE', 'HER', 'SURE', 'GIRL', 'TURN', 'TERM', 'SIR', 'HURT', 'FIRM', 'PURE', 'BIRD', 'BURN', 'CURE', 'DIRT', 'FUR', 'HERS', 'STIR', 'SURF', 'CURB', 'HERD'],
  },
  'sh': {
    id: 'sh',
    label: 'sh',
    group: 'Digraphs',
    words: ['SHE', 'SHY', 'ASH', 'SHED', 'SHIP', 'SHOP', 'SHUT', 'SHIN', 'SHAM', 'SHUN', 'SHOT', 'SHOE', 'SHOW', 'SASH', 'WISH', 'FISH', 'DISH', 'CASH', 'MASH', 'RASH', 'LASH', 'DASH', 'BASH', 'MUSH', 'PUSH', 'BUSH', 'RUSH', 'GUSH', 'HUSH', 'WASH', 'POSH', 'SHARK', 'SHELL', 'SHEEP', 'SHIRT', 'SHINE', 'SHAPE', 'SHADE', 'SHARE', 'SHORT', 'SHOUT', 'FRESH', 'CRASH', 'BRUSH', 'TRASH', 'SMASH', 'FLASH', 'SHEET', 'SHELF', 'SHOOK'],
    top20: ['SHE', 'SHOW', 'SHORT', 'SHOT', 'SHARE', 'WISH', 'SHIP', 'CASH', 'FISH', 'SHOP', 'FRESH', 'PUSH', 'SHUT', 'SHAPE', 'SHIRT', 'CRASH', 'BUSH', 'RUSH', 'WASH', 'FLASH'],
  },
  'ch': {
    id: 'ch',
    label: 'ch',
    group: 'Digraphs',
    words: ['CHAT', 'CHIN', 'CHIP', 'CHOP', 'CHAP', 'CHUG', 'CHUM', 'CHEW', 'CHOW', 'CHAR', 'SUCH', 'MUCH', 'RICH', 'INCH', 'ACHE', 'EACH', 'CHAIR', 'CHEEK', 'CHEST', 'CHICK', 'CHILD', 'CHALK', 'CHASE', 'CHEAP', 'LUNCH', 'BENCH', 'PINCH', 'BUNCH', 'PEACH', 'BEACH', 'TEACH', 'REACH', 'CHAIN', 'CHEER', 'CHECK'],
    top20: ['MUCH', 'SUCH', 'EACH', 'CHECK', 'CHILD', 'REACH', 'BEACH', 'RICH', 'CHEAP', 'CHAIR', 'TEACH', 'LUNCH', 'CHAIN', 'CHAT', 'BUNCH', 'CHEST', 'INCH', 'CHASE', 'BENCH', 'CHIP'],
  },
  'th': {
    id: 'th',
    label: 'th',
    group: 'Digraphs',
    words: ['THE', 'THEM', 'THEN', 'THIS', 'THAT', 'THAN', 'THIN', 'THUD', 'THUS', 'WITH', 'BATH', 'PATH', 'MATH', 'MOTH', 'BOTH', 'THAW', 'THREE', 'THING', 'THINK', 'THANK', 'THICK', 'TOOTH', 'MOUTH', 'TEETH', 'CLOTH', 'THUMB', 'THREW', 'THROW', 'THEY', 'THERE', 'THOSE'],
    top20: ['THE', 'THAT', 'WITH', 'THIS', 'THEY', 'THERE', 'THEM', 'THAN', 'THINK', 'THEN', 'THOSE', 'BOTH', 'THREE', 'THING', 'THANK', 'THUS', 'MOUTH', 'THROW', 'PATH', 'TEETH'],
  },
  'wh': {
    id: 'wh',
    label: 'wh',
    group: 'Digraphs',
    words: ['WHEN', 'WHAT', 'WHY', 'WHO', 'WHERE', 'WHALE', 'WHEEL', 'WHIP', 'WHITE', 'WHILE', 'WHICH', 'WHISK', 'WHEAT', 'WHIZ', 'WHIM', 'WHACK', 'WHINE', 'WHOLE', 'WHIFF'],
    top20: ['WHAT', 'WHEN', 'WHO', 'WHICH', 'WHERE', 'WHY', 'WHILE', 'WHITE', 'WHOLE', 'WHEEL', 'WHIP', 'WHEAT', 'WHALE', 'WHACK', 'WHIM', 'WHINE', 'WHIFF', 'WHISK', 'WHIZ'],
  },
  'ck': {
    id: 'ck',
    label: 'ck',
    group: 'Digraphs',
    words: ['BACK', 'PACK', 'SACK', 'TACK', 'RACK', 'LACK', 'JACK', 'DUCK', 'LUCK', 'BUCK', 'PUCK', 'TUCK', 'SICK', 'KICK', 'LICK', 'PICK', 'TICK', 'WICK', 'NICK', 'SOCK', 'LOCK', 'ROCK', 'MOCK', 'DOCK', 'NECK', 'PECK', 'DECK', 'BLACK', 'CLOCK', 'TRUCK', 'STICK', 'BRICK', 'QUACK', 'SNACK', 'STUCK', 'CHICK', 'TRACK'],
    top20: ['BACK', 'BLACK', 'PICK', 'ROCK', 'TRACK', 'LACK', 'LUCK', 'SICK', 'JACK', 'STICK', 'KICK', 'STUCK', 'PACK', 'TRUCK', 'NECK', 'NICK', 'LOCK', 'CLOCK', 'DECK', 'BRICK'],
  },
  'ng': {
    id: 'ng',
    label: 'ng',
    group: 'Digraphs',
    words: ['SING', 'RING', 'KING', 'WING', 'DING', 'PING', 'SANG', 'RANG', 'HANG', 'BANG', 'LONG', 'SONG', 'GONG', 'LUNG', 'HUNG', 'RUNG', 'SUNG', 'FANG', 'PANG', 'GANG', 'SWING', 'THING', 'BRING', 'STING', 'YOUNG'],
    top20: ['LONG', 'THING', 'YOUNG', 'BRING', 'SONG', 'KING', 'RING', 'WING', 'HANG', 'SING', 'GANG', 'SWING', 'BANG', 'HUNG', 'SANG', 'LUNG', 'SUNG', 'STING', 'PING', 'RANG'],
  },
  'bl': {
    id: 'bl',
    label: 'bl',
    group: 'Initial blends',
    words: ['BLUE', 'BLACK', 'BLOCK', 'BLOW', 'BLEW', 'BLAME', 'BLANK', 'BLAST', 'BLAZE', 'BLEND', 'BLESS', 'BLIND', 'BLINK', 'BLOB', 'BLOOM', 'BLOT', 'BLUR', 'BLUSH', 'BLADE', 'BLED', 'BLIP', 'BLEED', 'BLOWN'],
    top20: ['BLACK', 'BLUE', 'BLOCK', 'BLAME', 'BLOW', 'BLIND', 'BLAST', 'BLOWN', 'BLADE', 'BLESS', 'BLANK', 'BLEW', 'BLEND', 'BLOOM', 'BLINK', 'BLEED', 'BLAZE', 'BLUSH', 'BLUR', 'BLED'],
  },
  'cl': {
    id: 'cl',
    label: 'cl',
    group: 'Initial blends',
    words: ['CLAP', 'CLAM', 'CLASS', 'CLAW', 'CLAY', 'CLEAN', 'CLEAR', 'CLIFF', 'CLIMB', 'CLIP', 'CLOCK', 'CLOSE', 'CLOTH', 'CLOUD', 'CLOWN', 'CLUB', 'CLUE', 'CLUMP', 'CLAMP', 'CLANG', 'CLICK', 'CLING', 'CLOG', 'CLASH', 'CLERK'],
    top20: ['CLASS', 'CLOSE', 'CLEAR', 'CLUB', 'CLEAN', 'CLICK', 'CLOUD', 'CLOCK', 'CLAY', 'CLIP', 'CLIMB', 'CLUE', 'CLIFF', 'CLOTH', 'CLERK', 'CLASH', 'CLOWN', 'CLAW', 'CLAP', 'CLING'],
  },
  'fl': {
    id: 'fl',
    label: 'fl',
    group: 'Initial blends',
    words: ['FLAG', 'FLAP', 'FLAT', 'FLEA', 'FLED', 'FLEW', 'FLIP', 'FLOAT', 'FLOCK', 'FLOOD', 'FLOOR', 'FLOP', 'FLOSS', 'FLOUR', 'FLOW', 'FLUFF', 'FLUTE', 'FLY', 'FLAME', 'FLASH', 'FLICK', 'FLING', 'FLOWN', 'FLIES', 'FLAKE'],
    top20: ['FLOOR', 'FLY', 'FLAT', 'FLOW', 'FLAG', 'FLASH', 'FLOOD', 'FLIP', 'FLEW', 'FLIES', 'FLAME', 'FLED', 'FLOUR', 'FLOAT', 'FLOWN', 'FLOCK', 'FLICK', 'FLOP', 'FLUTE', 'FLAP'],
  },
  'gl': {
    id: 'gl',
    label: 'gl',
    group: 'Initial blends',
    words: ['GLINT', 'GLOAT', 'GLAD', 'GLASS', 'GLOW', 'GLUE', 'GLOBE', 'GLOVE', 'GLUM', 'GLOB', 'GLARE', 'GLEAM', 'GLEE', 'GLIDE', 'GLOOM', 'GLORY', 'GLAZE', 'GLOSS'],
    top20: ['GLAD', 'GLASS', 'GLORY', 'GLOBE', 'GLOW', 'GLUE', 'GLOVE', 'GLEE', 'GLOSS', 'GLARE', 'GLIDE', 'GLOOM', 'GLAZE', 'GLEAM', 'GLINT', 'GLOAT', 'GLUM', 'GLOB'],
  },
  'pl': {
    id: 'pl',
    label: 'pl',
    group: 'Initial blends',
    words: ['PLAN', 'PLANE', 'PLANT', 'PLATE', 'PLAY', 'PLEA', 'PLOT', 'PLUG', 'PLUM', 'PLUS', 'PLUSH', 'PLACE', 'PLAIN', 'PLANK', 'PLAZA', 'PLOP', 'PLOW', 'PLUMP', 'PLUCK'],
    top20: ['PLACE', 'PLAY', 'PLAN', 'PLUS', 'PLANT', 'PLANE', 'PLOT', 'PLATE', 'PLAIN', 'PLUG', 'PLEA', 'PLAZA', 'PLUM', 'PLANK', 'PLUSH', 'PLOW', 'PLUMP', 'PLUCK', 'PLOP'],
  },
  'sl': {
    id: 'sl',
    label: 'sl',
    group: 'Initial blends',
    words: ['SLAB', 'SLAM', 'SLAP', 'SLED', 'SLEEP', 'SLEPT', 'SLICE', 'SLID', 'SLIDE', 'SLIM', 'SLIME', 'SLIP', 'SLOT', 'SLOW', 'SLUG', 'SLUSH', 'SLY', 'SLANT', 'SLEET', 'SLING', 'SLOPE', 'SLOTH', 'SLURP'],
    top20: ['SLEEP', 'SLOW', 'SLIDE', 'SLIP', 'SLEPT', 'SLOT', 'SLIM', 'SLAM', 'SLICE', 'SLAP', 'SLOPE', 'SLID', 'SLAB', 'SLY', 'SLIME', 'SLING', 'SLUG', 'SLED', 'SLANT', 'SLOTH'],
  },
  'br': {
    id: 'br',
    label: 'br',
    group: 'Initial blends',
    words: ['BRAG', 'BRAIN', 'BRAKE', 'BRAND', 'BRASS', 'BRAVE', 'BREAD', 'BREAK', 'BRICK', 'BRIDE', 'BRIM', 'BRING', 'BROOK', 'BROOM', 'BROTH', 'BROWN', 'BRUSH', 'BREW', 'BRED', 'BRIEF', 'BROKE'],
    top20: ['BRING', 'BREAK', 'BROWN', 'BRAIN', 'BROKE', 'BRAND', 'BRIEF', 'BREAD', 'BRAVE', 'BRICK', 'BRUSH', 'BRIDE', 'BRASS', 'BRAKE', 'BRED', 'BROOK', 'BREW', 'BRAG', 'BROOM', 'BROTH'],
  },
  'cr': {
    id: 'cr',
    label: 'cr',
    group: 'Initial blends',
    words: ['CRAB', 'CRACK', 'CRAFT', 'CRANE', 'CRASH', 'CRAWL', 'CRAZY', 'CREAM', 'CREEK', 'CREEP', 'CREW', 'CRIB', 'CRISP', 'CROAK', 'CROP', 'CROSS', 'CROW', 'CROWD', 'CROWN', 'CRUMB', 'CRUSH', 'CRUST', 'CRY', 'CRATE'],
    top20: ['CRAZY', 'CROSS', 'CREW', 'CROWD', 'CREAM', 'CRY', 'CROWN', 'CRASH', 'CRACK', 'CREEK', 'CRAFT', 'CRUSH', 'CROP', 'CRANE', 'CREEP', 'CROW', 'CRAWL', 'CRAB', 'CRISP', 'CRUST'],
  },
  'dr': {
    id: 'dr',
    label: 'dr',
    group: 'Initial blends',
    words: ['DRAG', 'DRAIN', 'DRANK', 'DRAW', 'DRAWN', 'DREAM', 'DRESS', 'DREW', 'DRIED', 'DRILL', 'DRINK', 'DRIP', 'DRIVE', 'DROP', 'DROVE', 'DRUM', 'DRY', 'DRIFT', 'DRAKE'],
    top20: ['DRIVE', 'DROP', 'DREAM', 'DRINK', 'DRAW', 'DRESS', 'DRY', 'DRAWN', 'DREW', 'DROVE', 'DRAG', 'DRUM', 'DRILL', 'DRAIN', 'DRIED', 'DRAKE', 'DRANK', 'DRIFT', 'DRIP'],
  },
  'fr': {
    id: 'fr',
    label: 'fr',
    group: 'Initial blends',
    words: ['FREED', 'FROTH', 'FRET', 'FRAY', 'FRISK', 'FRAME', 'FREE', 'FRESH', 'FRIED', 'FRIES', 'FROG', 'FROM', 'FRONT', 'FROST', 'FROWN', 'FROZE', 'FRUIT', 'FRY', 'FRILL'],
    top20: ['FROM', 'FREE', 'FRONT', 'FRESH', 'FRAME', 'FRUIT', 'FRIED', 'FROST', 'FROG', 'FRY', 'FREED', 'FRIES', 'FROZE', 'FRAY', 'FRET', 'FROWN', 'FRISK', 'FROTH', 'FRILL'],
  },
  'gr': {
    id: 'gr',
    label: 'gr',
    group: 'Initial blends',
    words: ['GRAB', 'GRADE', 'GRAIN', 'GRAND', 'GRAPE', 'GRASS', 'GRAY', 'GREAT', 'GREEN', 'GREW', 'GREY', 'GRID', 'GRIN', 'GRIP', 'GROW', 'GROWL', 'GROWN', 'GRUB', 'GRILL', 'GROAN', 'GRAPH'],
    top20: ['GREAT', 'GREEN', 'GRAND', 'GROW', 'GRADE', 'GREW', 'GROWN', 'GRAB', 'GREY', 'GRAY', 'GRASS', 'GRAIN', 'GRID', 'GRIP', 'GRAPH', 'GRILL', 'GRAPE', 'GRIN', 'GROWL', 'GRUB'],
  },
  'tr': {
    id: 'tr',
    label: 'tr',
    group: 'Initial blends',
    words: ['TRACK', 'TRADE', 'TRAIL', 'TRAIN', 'TRAP', 'TRASH', 'TRAY', 'TREAT', 'TREE', 'TRICK', 'TRIED', 'TRIM', 'TRIP', 'TROT', 'TRUCK', 'TRUE', 'TRUNK', 'TRUST', 'TRUTH', 'TRY', 'TRACE', 'TRIBE'],
    top20: ['TRY', 'TRUE', 'TRIED', 'TRUST', 'TRADE', 'TRUTH', 'TRACK', 'TRAIN', 'TRIP', 'TREE', 'TREAT', 'TRUCK', 'TRICK', 'TRAIL', 'TRASH', 'TRAP', 'TRACE', 'TRIBE', 'TRUNK', 'TRIM'],
  },
  'sp': {
    id: 'sp',
    label: 'sp',
    group: 'Initial blends',
    words: ['SPACE', 'SPADE', 'SPARK', 'SPEAK', 'SPED', 'SPELL', 'SPEND', 'SPENT', 'SPICE', 'SPILL', 'SPIN', 'SPIT', 'SPOKE', 'SPOON', 'SPORT', 'SPOT', 'SPUN', 'SPY', 'SPEED', 'SPINE', 'SPOIL', 'SPOOK', 'SPARE'],
    top20: ['SPACE', 'SPEAK', 'SPENT', 'SPEED', 'SPEND', 'SPOT', 'SPORT', 'SPOKE', 'SPIN', 'SPELL', 'SPARE', 'SPY', 'SPARK', 'SPICE', 'SPINE', 'SPOON', 'SPIT', 'SPILL', 'SPOIL', 'SPUN'],
  },
  'st': {
    id: 'st',
    label: 'st',
    group: 'Initial blends',
    words: ['STAR', 'STOP', 'STEP', 'STAY', 'STEM', 'STICK', 'STAMP', 'STAND', 'STONE', 'STORE', 'STORM', 'STORY', 'STOOL', 'STUCK', 'STUFF', 'STIR', 'STEAM', 'STILL', 'STING', 'STOVE', 'STUDY', 'STAGE', 'STAIR', 'STACK'],
    top20: ['STILL', 'STOP', 'STORY', 'STAY', 'STUDY', 'STAR', 'STAND', 'STUFF', 'STEP', 'STAGE', 'STORE', 'STONE', 'STICK', 'STUCK', 'STORM', 'STEAM', 'STEM', 'STAMP', 'STACK', 'STIR'],
  },
  'sw': {
    id: 'sw',
    label: 'sw',
    group: 'Initial blends',
    words: ['SWAM', 'SWAN', 'SWAP', 'SWAY', 'SWEAT', 'SWEEP', 'SWEET', 'SWELL', 'SWEPT', 'SWIFT', 'SWIM', 'SWING', 'SWISH', 'SWAMP', 'SWARM', 'SWORD', 'SWIRL', 'SWUNG'],
    top20: ['SWEET', 'SWORD', 'SWING', 'SWIM', 'SWIFT', 'SWEAT', 'SWEEP', 'SWAP', 'SWEPT', 'SWAN', 'SWAMP', 'SWAY', 'SWELL', 'SWUNG', 'SWARM', 'SWAM', 'SWIRL', 'SWISH'],
  },
  '-nd': {
    id: '-nd',
    label: '-nd',
    group: 'Final blends',
    words: ['AND', 'HAND', 'LAND', 'SAND', 'BAND', 'STAND', 'BEND', 'SEND', 'MEND', 'WIND', 'KIND', 'MIND', 'FIND', 'POND', 'FOND', 'ROUND', 'SOUND', 'FOUND', 'POUND', 'HOUND', 'BLEND', 'GRAND', 'BRAND', 'END', 'FUND'],
    top20: ['AND', 'FIND', 'FOUND', 'END', 'KIND', 'HAND', 'MIND', 'LAND', 'SOUND', 'STAND', 'ROUND', 'SEND', 'BAND', 'GRAND', 'WIND', 'BRAND', 'FUND', 'SAND', 'POUND', 'BEND'],
  },
  '-nk': {
    id: '-nk',
    label: '-nk',
    group: 'Final blends',
    words: ['PINK', 'SINK', 'THINK', 'DRINK', 'BANK', 'TANK', 'THANK', 'BLINK', 'WINK', 'LINK', 'INK', 'MINK', 'HONK', 'BUNK', 'JUNK', 'SKUNK', 'TRUNK', 'DUNK', 'CHUNK', 'SANK', 'DRANK', 'STINK', 'PLANK', 'BLANK'],
    top20: ['THINK', 'THANK', 'BANK', 'LINK', 'DRINK', 'TANK', 'PINK', 'SINK', 'BLANK', 'INK', 'JUNK', 'TRUNK', 'DRANK', 'BLINK', 'SANK', 'CHUNK', 'DUNK', 'WINK', 'STINK', 'PLANK'],
  },
  '-nt': {
    id: '-nt',
    label: '-nt',
    group: 'Final blends',
    words: ['ANT', 'TENT', 'RENT', 'DENT', 'BENT', 'WENT', 'SENT', 'SPENT', 'HUNT', 'MINT', 'HINT', 'PRINT', 'PLANT', 'PAINT', 'FRONT', 'POINT', 'PANT', 'GIANT', 'COUNT', 'AUNT'],
    top20: ['POINT', 'WENT', 'FRONT', 'SENT', 'SPENT', 'PLANT', 'COUNT', 'GIANT', 'RENT', 'PRINT', 'PAINT', 'HUNT', 'AUNT', 'HINT', 'TENT', 'BENT', 'MINT', 'ANT', 'DENT', 'PANT'],
  },
  '-mp': {
    id: '-mp',
    label: '-mp',
    group: 'Final blends',
    words: ['JUMP', 'BUMP', 'LUMP', 'PUMP', 'STUMP', 'CAMP', 'DAMP', 'LAMP', 'RAMP', 'STAMP', 'CLAMP', 'LIMP', 'BLIMP', 'CHIMP', 'GRUMP', 'PLUMP', 'SWAMP', 'CHAMP'],
    top20: ['CAMP', 'JUMP', 'PUMP', 'STAMP', 'LAMP', 'BUMP', 'CHAMP', 'SWAMP', 'RAMP', 'LUMP', 'DAMP', 'STUMP', 'CLAMP', 'LIMP', 'PLUMP', 'CHIMP', 'BLIMP', 'GRUMP'],
  },
  '-st': {
    id: '-st',
    label: '-st',
    group: 'Final blends',
    words: ['BEST', 'NEST', 'REST', 'TEST', 'VEST', 'WEST', 'LAST', 'FAST', 'PAST', 'CAST', 'LIST', 'MIST', 'FIST', 'DUST', 'MUST', 'RUST', 'JUST', 'LOST', 'COST', 'TOAST', 'FEAST'],
    top20: ['JUST', 'LAST', 'BEST', 'MUST', 'LOST', 'PAST', 'WEST', 'LIST', 'COST', 'REST', 'TEST', 'FAST', 'CAST', 'DUST', 'NEST', 'TOAST', 'FEAST', 'FIST', 'RUST', 'VEST'],
  },
  'short-a': {
    id: 'short-a',
    label: 'short a',
    group: 'Short vowels',
    words: ['CAB', 'LAB', 'TAB', 'BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAD', 'DAD', 'HAD', 'LAD', 'MAD', 'PAD', 'SAD', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BAG', 'RAG', 'TAG', 'WAG', 'CAP', 'GAP', 'LAP', 'MAP', 'NAP', 'RAP', 'SAP', 'TAP', 'HAM', 'JAM', 'RAM', 'PAL', 'GAS'],
    top20: ['CAN', 'HAD', 'MAN', 'BAD', 'GAS', 'DAD', 'FAN', 'RAN', 'FAT', 'SAD', 'BAG', 'CAT', 'VAN', 'MAP', 'MAD', 'SAT', 'BAN', 'HAT', 'CAP', 'GAP'],
  },
  'short-e': {
    id: 'short-e',
    label: 'short e',
    group: 'Short vowels',
    words: ['BED', 'FED', 'LED', 'RED', 'WED', 'BEG', 'LEG', 'BET', 'GET', 'JET', 'LET', 'MET', 'NET', 'PET', 'SET', 'VET', 'WET', 'YET', 'DEN', 'HEN', 'MEN', 'PEN', 'TEN', 'YES', 'WEB'],
    top20: ['GET', 'LET', 'SET', 'YET', 'MEN', 'YES', 'RED', 'LED', 'MET', 'BED', 'TEN', 'BET', 'NET', 'WEB', 'LEG', 'WET', 'FED', 'PET', 'PEN', 'JET'],
  },
  'short-i': {
    id: 'short-i',
    label: 'short i',
    group: 'Short vowels',
    words: ['BIT', 'FIT', 'HIT', 'KIT', 'LIT', 'PIT', 'SIT', 'DID', 'HID', 'KID', 'LID', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'DIM', 'HIM', 'RIM', 'DIP', 'HIP', 'LIP', 'RIP', 'SIP', 'TIP', 'ZIP', 'BIN', 'FIN', 'PIN', 'TIN', 'WIN', 'MIX', 'SIX', 'FIX'],
    top20: ['HIM', 'DID', 'BIG', 'WIN', 'BIT', 'HIT', 'SIX', 'KID', 'FIT', 'SIT', 'FIX', 'MIX', 'TIP', 'HIP', 'KIT', 'PIN', 'PIT', 'RIP', 'DIG', 'BIN'],
  },
  'short-o': {
    id: 'short-o',
    label: 'short o',
    group: 'Short vowels',
    words: ['COT', 'DOT', 'GOT', 'HOT', 'LOT', 'NOT', 'POT', 'ROT', 'COB', 'JOB', 'ROB', 'SOB', 'DOG', 'FOG', 'HOG', 'JOG', 'LOG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BOX', 'FOX', 'ROD', 'MOM'],
    top20: ['NOT', 'GOT', 'LOT', 'TOP', 'JOB', 'HOT', 'MOM', 'DOG', 'BOX', 'POP', 'FOX', 'POT', 'HOP', 'LOG', 'COP', 'ROB', 'ROD', 'DOT', 'FOG', 'ROT'],
  },
  'short-u': {
    id: 'short-u',
    label: 'short u',
    group: 'Short vowels',
    words: ['CUB', 'RUB', 'SUB', 'TUB', 'BUD', 'MUD', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG', 'GUM', 'HUM', 'SUM', 'BUN', 'FUN', 'GUN', 'RUN', 'SUN', 'BUT', 'CUT', 'HUT', 'NUT', 'PUP', 'CUP', 'BUS'],
    top20: ['BUT', 'RUN', 'FUN', 'CUT', 'CUP', 'SUN', 'GUN', 'BUS', 'SUB', 'SUM', 'BUG', 'MUD', 'HUG', 'BUD', 'NUT', 'RUB', 'GUM', 'DUG', 'TUB', 'HUT'],
  },
  'a-e': {
    id: 'a-e',
    label: 'a_e',
    group: 'Magic e',
    words: ['ATE', 'AGE', 'APE', 'ACE', 'CAKE', 'BAKE', 'LAKE', 'MAKE', 'RAKE', 'WAKE', 'FAKE', 'SAKE', 'TAME', 'FAME', 'LAME', 'CAME', 'SAME', 'NAME', 'PANE', 'LANE', 'CANE', 'MANE', 'DATE', 'FATE', 'HATE', 'MATE', 'RATE', 'LATE', 'GATE', 'CAPE', 'TAPE', 'FADE', 'WADE', 'MADE', 'WAVE', 'CAVE', 'GAVE', 'SAVE', 'GAME', 'TAKE', 'PALE', 'SALE'],
    top20: ['MAKE', 'MADE', 'TAKE', 'SAME', 'GAME', 'NAME', 'CAME', 'LATE', 'AGE', 'GAVE', 'DATE', 'RATE', 'SAVE', 'HATE', 'SALE', 'LAKE', 'WAKE', 'FAKE', 'WAVE', 'LANE'],
  },
  'i-e': {
    id: 'i-e',
    label: 'i_e',
    group: 'Magic e',
    words: ['LIKE', 'BIKE', 'HIKE', 'MIKE', 'PIKE', 'DIME', 'TIME', 'LIME', 'RIPE', 'PIPE', 'WIPE', 'FIVE', 'HIVE', 'LIVE', 'DIVE', 'KITE', 'BITE', 'MITE', 'SITE', 'RIDE', 'HIDE', 'SIDE', 'TIDE', 'WIDE', 'MINE', 'NINE', 'LINE', 'PINE', 'FINE', 'DINE', 'VINE', 'ICE', 'RICE', 'NICE', 'MICE', 'DICE', 'SIZE', 'FIRE', 'TIRE', 'WIRE', 'HIRE'],
    top20: ['LIKE', 'TIME', 'LIVE', 'SIDE', 'LINE', 'FIVE', 'NICE', 'FIRE', 'FINE', 'SITE', 'SIZE', 'MINE', 'ICE', 'WIDE', 'NINE', 'RIDE', 'MIKE', 'RICE', 'HIDE', 'BIKE'],
  },
  'o-e': {
    id: 'o-e',
    label: 'o_e',
    group: 'Magic e',
    words: ['HOME', 'HOPE', 'ROPE', 'COPE', 'HOLE', 'POLE', 'MOLE', 'ROLE', 'BONE', 'CONE', 'ZONE', 'TONE', 'LONE', 'NOSE', 'ROSE', 'HOSE', 'POSE', 'DOSE', 'NOTE', 'VOTE', 'TOTE', 'RODE', 'CODE', 'MODE', 'JOKE', 'POKE', 'WOKE', 'YOKE', 'ROBE', 'ONE'],
    top20: ['ONE', 'HOME', 'HOPE', 'ROLE', 'VOTE', 'CODE', 'NOTE', 'ROSE', 'ZONE', 'JOKE', 'HOLE', 'MODE', 'NOSE', 'TONE', 'BONE', 'POLE', 'WOKE', 'DOSE', 'POSE', 'ROPE'],
  },
  'u-e': {
    id: 'u-e',
    label: 'u_e',
    group: 'Magic e',
    words: ['USE', 'CUTE', 'CUBE', 'TUBE', 'MULE', 'RULE', 'FUME', 'HUGE', 'TUNE', 'DUNE', 'RUDE', 'MUTE', 'LUTE', 'DUKE', 'CURE', 'PURE', 'SURE', 'BLUE', 'GLUE', 'TRUE', 'CLUE'],
    top20: ['USE', 'SURE', 'TRUE', 'BLUE', 'HUGE', 'RULE', 'CUTE', 'PURE', 'DUKE', 'TUBE', 'CURE', 'TUNE', 'RUDE', 'CLUE', 'CUBE', 'GLUE', 'MUTE', 'MULE', 'DUNE', 'LUTE'],
  },
};

export const PRESET_WORDS = {
  sight: ['AND', 'AWAY', 'BIG', 'BLUE', 'CAN', 'COME', 'DOWN', 'FIND', 'FOR', 'GO', 'HELP', 'HERE', 'IN', 'IS', 'IT', 'JUMP', 'LOOK', 'MAKE', 'ME', 'MY', 'NOT', 'ONE', 'PLAY', 'RED', 'RUN', 'SAID', 'SEE', 'THE', 'TO', 'TWO', 'UP', 'WE', 'YOU', 'ALL', 'AM', 'ARE', 'AT', 'ATE', 'BE', 'BUT', 'CAME', 'DID', 'DO', 'EAT', 'FOUR', 'GET', 'GOOD', 'HAVE', 'HE', 'INTO', 'LIKE', 'MUST', 'NEW', 'NO', 'NOW', 'ON', 'OUR', 'OUT', 'RAN', 'RIDE', 'SAW', 'SAY', 'SHE', 'SO', 'SOON', 'THAT', 'THEY', 'THIS', 'TOO', 'WANT', 'WAS', 'WELL', 'WENT', 'WHAT', 'WHO', 'WILL', 'WITH', 'YES', 'AN', 'ANY', 'AS', 'ASK', 'BY', 'FLY', 'FROM', 'GIVE', 'HAD', 'HAS', 'HER', 'HIM', 'HIS', 'HOW', 'JUST', 'KNOW', 'LET', 'LIVE', 'MAY', 'OF', 'OLD', 'ONCE', 'OPEN', 'OVER', 'PUT', 'SOME', 'STOP', 'TAKE', 'THEM', 'THEN', 'WALK', 'WERE', 'WHEN', 'BEEN', 'BEST', 'BOTH', 'BUY', 'CALL', 'COLD', 'DOES', 'DONE', 'FAST', 'FIVE', 'GAVE', 'GOES', 'ITS', 'MADE', 'MANY', 'OFF', 'OR', 'PULL', 'READ', 'SING', 'SIT', 'TELL', 'UPON', 'US', 'USE', 'VERY', 'WASH', 'WHY', 'WISH', 'WORK', 'YOUR', 'BABY', 'BACK', 'BALL', 'BEAR', 'BED', 'BELL', 'BIRD', 'BOAT', 'BOX', 'BOY', 'CAKE', 'CAR', 'CAT', 'COAT', 'CORN', 'COW', 'DAY', 'DOG', 'DOLL', 'DOOR', 'DUCK', 'EGG', 'EYE', 'FARM', 'FEET', 'FIRE', 'FISH', 'GAME', 'GIRL', 'HAND', 'HEAD', 'HILL', 'HOME', 'LEG', 'MAN', 'MEN', 'MILK', 'NAME', 'NEST', 'PIG', 'RAIN', 'RING', 'SEED', 'SHOE', 'SNOW', 'SONG', 'SUN', 'TIME', 'TOP', 'TOY', 'TREE', 'WAY', 'WIND', 'WOOD', 'WORD', 'EACH', 'IF', 'MORE', 'THAN', 'OIL', 'LONG', 'PART', 'ONLY', 'YEAR', 'MOST', 'MUCH', 'LINE', 'MEAN', 'SAME', 'SHOW', 'ALSO', 'SET', 'END', 'EVEN', 'SUCH', 'TURN', 'NEED', 'LAND', 'MOVE', 'TRY', 'KIND', 'AIR', 'PAGE', 'HIGH', 'NEAR', 'ADD', 'FOOD', 'OWN', 'LAST', 'KEEP', 'CITY', 'LEFT', 'FEW', 'SEEM', 'NEXT', 'HARD', 'LIFE', 'GOT', 'SIDE', 'MILE', 'SEA', 'GROW', 'TOOK', 'BOOK', 'HEAR', 'LATE', 'MISS', 'IDEA', 'FACE', 'FAR', 'REAL', 'CUT', 'TALK', 'LIST'] as const,
  cvc: ['CAB', 'LAB', 'TAB', 'BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAD', 'DAD', 'HAD', 'LAD', 'MAD', 'PAD', 'SAD', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BAG', 'RAG', 'TAG', 'WAG', 'CAP', 'GAP', 'LAP', 'MAP', 'NAP', 'RAP', 'SAP', 'TAP', 'HAM', 'JAM', 'RAM', 'PAL', 'GAS', 'BED', 'FED', 'LED', 'RED', 'WED', 'BEG', 'LEG', 'BET', 'GET', 'JET', 'LET', 'MET', 'NET', 'PET', 'SET', 'VET', 'WET', 'YET', 'DEN', 'HEN', 'MEN', 'PEN', 'TEN', 'YES', 'WEB', 'BIT', 'FIT', 'HIT', 'KIT', 'LIT', 'PIT', 'SIT', 'DID', 'HID', 'KID', 'LID', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'DIM', 'HIM', 'RIM', 'DIP', 'HIP', 'LIP', 'RIP', 'SIP', 'TIP', 'ZIP', 'BIN', 'FIN', 'PIN', 'TIN', 'WIN', 'MIX', 'SIX', 'FIX', 'COT', 'DOT', 'GOT', 'HOT', 'LOT', 'NOT', 'POT', 'ROT', 'COB', 'JOB', 'ROB', 'SOB', 'DOG', 'FOG', 'HOG', 'JOG', 'LOG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BOX', 'FOX', 'ROD', 'MOM', 'CUB', 'RUB', 'SUB', 'TUB', 'BUD', 'MUD', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG', 'GUM', 'HUM', 'SUM', 'BUN', 'FUN', 'GUN', 'RUN', 'SUN', 'BUT', 'CUT', 'HUT', 'NUT', 'PUP', 'CUP', 'BUS'] as const,
  families: ['BAT', 'CAT', 'FAT', 'HAT', 'MAT', 'PAT', 'RAT', 'SAT', 'BAN', 'CAN', 'FAN', 'MAN', 'PAN', 'RAN', 'TAN', 'VAN', 'BIG', 'DIG', 'FIG', 'PIG', 'WIG', 'RIG', 'COP', 'HOP', 'MOP', 'POP', 'TOP', 'BUG', 'DUG', 'HUG', 'JUG', 'MUG', 'RUG', 'TUG'] as const,
  blends: ['SHE', 'SHY', 'ASH', 'SHED', 'SHIP', 'SHOP', 'SHUT', 'SHIN', 'SHAM', 'SHUN', 'SHOT', 'SHOE', 'SHOW', 'SASH', 'WISH', 'FISH', 'DISH', 'CASH', 'MASH', 'RASH', 'LASH', 'DASH', 'BASH', 'MUSH', 'PUSH', 'BUSH', 'RUSH', 'GUSH', 'HUSH', 'WASH', 'POSH', 'CHAT', 'CHIN', 'CHIP', 'CHOP', 'CHAP', 'CHUG', 'CHUM', 'CHEW', 'CHOW', 'CHAR', 'SUCH', 'MUCH', 'RICH', 'INCH', 'ACHE', 'EACH', 'THE', 'THEM', 'THEN', 'THIS', 'THAT', 'THAN', 'THIN', 'THUD', 'THUS', 'WITH', 'BATH', 'PATH', 'MATH', 'MOTH', 'BOTH', 'THAW', 'WHO', 'WHY', 'WHEN', 'WHAT', 'WHIP', 'WHIM', 'WHET', 'BACK', 'PACK', 'SACK', 'TACK', 'RACK', 'LACK', 'JACK', 'DUCK', 'LUCK', 'BUCK', 'PUCK', 'TUCK', 'SICK', 'KICK', 'LICK', 'PICK', 'TICK', 'WICK', 'NICK', 'SOCK', 'LOCK', 'ROCK', 'MOCK', 'DOCK', 'NECK', 'PECK', 'DECK', 'STOP', 'STEP', 'STAR', 'STAY', 'STEM', 'STIR', 'JUST', 'LAST', 'BEST', 'NEST', 'REST', 'LIST', 'MIST', 'MUST', 'FAST', 'PAST', 'WEST', 'COST', 'LOST', 'POST', 'MOST', 'DUST', 'RUST', 'FIST', 'BLUE', 'BLOW', 'BLOT', 'BLOB', 'BLED', 'CLAP', 'CLIP', 'CLOD', 'CLOG', 'CLUB', 'CLAM', 'CLAN', 'CLAW', 'CLAY', 'CLOT', 'FLAG', 'FLAP', 'FLAT', 'FLIP', 'FLOP', 'FLEE', 'FLEA', 'FLAW', 'FLED', 'FLOW', 'PLAN', 'PLAY', 'PLOT', 'PLOP', 'PLUS', 'PLEA', 'PLOD', 'PLUM', 'PLUG', 'SLAP', 'SLIM', 'SLIP', 'SLOP', 'SLOT', 'SLAM', 'SLAT', 'SLED', 'SLOW', 'SLIT', 'BRAT', 'BRIM', 'BRAG', 'BRAN', 'BROW', 'BRED', 'BRAY', 'CRAB', 'CRAM', 'CRIB', 'CROP', 'CROW', 'CREW', 'CRY', 'DRAB', 'DRAG', 'DRIP', 'DROP', 'DRUM', 'DREW', 'DRY', 'FROG', 'FROM', 'FRET', 'FRY', 'GRAB', 'GRAM', 'GRIM', 'GRIN', 'GRIP', 'GRIT', 'GROW', 'GRUB', 'GRAY', 'GREY', 'TRAP', 'TRAY', 'TREE', 'TRIM', 'TRIP', 'TROT', 'TRUE', 'TRY', 'TRAM', 'TREK', 'SWIM', 'SWAB', 'SWAT', 'SWAY', 'SWIG', 'SWUM', 'SMOG', 'SMUG', 'SNAP', 'SNIP', 'SNOB', 'SNUG', 'SNUB', 'SPAN', 'SPIN', 'SPIT', 'SPOT', 'SPUN', 'SPAR', 'SPAT', 'SPED', 'SKIN', 'SKIP', 'SKID', 'SKIM', 'SKIT', 'TWIN', 'TWIG', 'TWO', 'SING', 'RING', 'KING', 'WING', 'DING', 'PING', 'SANG', 'RANG', 'HANG', 'BANG', 'LONG', 'SONG', 'GONG', 'LUNG', 'HUNG', 'RUNG', 'SUNG', 'FANG', 'PANG', 'GANG'] as const,
};


export const PRESET_WEIGHTS: Record<Exclude<LetterPresetId, 'standard'>, WeightMap> = {
  sight: { A:10.00, B:3.11, C:2.02, D:4.54, E:11.05, F:2.29, G:3.20, H:3.92, I:6.01, J:0.29, K:1.38, L:4.29, M:3.45, N:5.59, O:9.07, P:2.92, R:4.10, S:4.72, T:7.28, U:3.87, V:0.76, W:3.29, X:0.29, Y:2.45, Z:0.11 },
  cvc: { A:10.95, B:5.35, C:1.91, D:5.35, E:6.37, F:1.91, G:5.73, H:2.68, I:8.92, J:0.96, K:0.38, L:2.29, M:4.01, N:5.16, O:6.62, P:6.50, R:2.87, S:2.68, T:9.17, U:7.13, V:0.38, W:1.15, X:0.96, Y:0.38, Z:0.19 },
  families: { A:14.75, B:4.21, C:2.73, D:2.64, E:1.27, F:2.73, G:11.35, H:2.89, I:6.49, J:0.98, K:0.08, L:0.46, M:3.94, N:7.30, O:5.24, P:8.36, R:3.71, S:1.32, T:10.46, U:6.91, V:0.86, W:1.01, X:0.19, Y:0.08, Z:0.04 },
  blends: { A:11.29, B:2.39, C:4.99, D:1.95, E:5.60, F:1.48, G:3.59, H:6.06, I:8.19, J:0.16, K:2.79, L:4.31, M:2.47, N:3.59, O:7.18, P:4.31, R:4.87, S:8.34, T:6.34, U:5.75, W:2.99, Y:1.36 },
};

export const PRESET_META: Record<LetterPresetId, { label: string; blurb: string }> = {
  standard: {
    label: 'Standard (by difficulty)',
    blurb: 'Beginner, Easy, and the rest keep their usual letter mix',
  },
  sight: {
    label: 'Sight Words',
    blurb: 'Dolch and Fry words kids see often',
  },
  cvc: {
    label: 'Short Vowels / CVC',
    blurb: 'cat, bed, pig, hop, sun',
  },
  families: {
    label: 'Word Families',
    blurb: '–at, –an, –ig, –op, –ug',
  },
  blends: {
    label: 'Blends & Digraphs',
    blurb: 'sh, ch, th, st, bl…',
  },
};
