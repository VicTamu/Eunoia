/**
 * Lightweight, client-side reflection read used only on the landing page demo.
 *
 * This intentionally mirrors the *shape* of the real backend analysis
 * (a primary emotion, a 0-10 mood and stress read, and a gentle insight)
 * using a small keyword model so a visitor can feel what Eunoia does before
 * signing up. It never calls the API and is not used for saved entries.
 */

export type DemoEmotionGroup = 'positive' | 'negative' | 'neutral';

export interface DemoAnalysis {
  emotion: string;
  emotionGroup: DemoEmotionGroup;
  mood: number;
  moodLabel: string;
  stress: number;
  stressLabel: string;
  tags: string[];
  insight: string;
}

interface EmotionBucket {
  label: string;
  group: DemoEmotionGroup;
  keywords: string[];
}

// Ordered roughly by specificity; mirrors the spirit of the backend lexicons.
const EMOTION_BUCKETS: EmotionBucket[] = [
  {
    label: 'Gratitude',
    group: 'positive',
    keywords: ['grateful', 'thankful', 'blessed', 'appreciate', 'appreciated', 'lucky'],
  },
  {
    label: 'Relief',
    group: 'positive',
    keywords: [
      'relieved',
      'relief',
      'calm',
      'calmer',
      'relaxed',
      'settled',
      'steady',
      'better',
      'lighter',
      'peaceful',
    ],
  },
  {
    label: 'Joy',
    group: 'positive',
    keywords: [
      'happy',
      'joy',
      'joyful',
      'excited',
      'glad',
      'delighted',
      'great',
      'wonderful',
      'good',
      'fun',
      'smiled',
    ],
  },
  {
    label: 'Pride',
    group: 'positive',
    keywords: ['proud', 'accomplished', 'achieved', 'finished', 'managed', 'capable'],
  },
  {
    label: 'Hope',
    group: 'positive',
    keywords: ['hopeful', 'hope', 'optimistic', 'looking forward', 'excited for'],
  },
  {
    label: 'Love',
    group: 'positive',
    keywords: ['love', 'loved', 'cherish', 'cared', 'caring', 'close'],
  },
  {
    label: 'Nervousness',
    group: 'negative',
    keywords: [
      'anxious',
      'anxiety',
      'nervous',
      'worried',
      'worry',
      'scared',
      'afraid',
      'panic',
      'overwhelmed',
      'uneasy',
    ],
  },
  {
    label: 'Stress',
    group: 'negative',
    keywords: [
      'stressed',
      'stress',
      'pressure',
      'deadline',
      'deadlines',
      'hectic',
      'busy',
      'rushed',
      'burned out',
      'burnt out',
      'exhausted',
      'tired',
      'drained',
      'swamped',
    ],
  },
  {
    label: 'Sadness',
    group: 'negative',
    keywords: [
      'sad',
      'down',
      'low',
      'lonely',
      'alone',
      'hurt',
      'lost',
      'empty',
      'grief',
      'heavy',
      'crying',
      'cried',
      'miss',
      'missing',
    ],
  },
  {
    label: 'Frustration',
    group: 'negative',
    keywords: [
      'angry',
      'mad',
      'furious',
      'annoyed',
      'irritated',
      'frustrated',
      'frustrating',
      'fed up',
    ],
  },
];

const STRESS_KEYWORDS = [
  'stressed',
  'stress',
  'anxious',
  'anxiety',
  'worried',
  'worry',
  'overwhelmed',
  'pressure',
  'tension',
  'nervous',
  'panic',
  'deadline',
  'deadlines',
  'urgent',
  'rushed',
  'busy',
  'hectic',
  'burned out',
  'burnt out',
  'exhausted',
  'drained',
];

const POSITIVE_HINTS = [
  'thank',
  'grateful',
  'happy',
  'joy',
  'love',
  'proud',
  'calm',
  'relief',
  'relieved',
  'hopeful',
  'hope',
  'excited',
  'good',
  'better',
  'great',
  'glad',
  'peaceful',
  'settled',
];

const NEGATIVE_HINTS = [
  'sad',
  'anxious',
  'anxiety',
  'worried',
  'stressed',
  'stress',
  'overwhelmed',
  'tired',
  'exhausted',
  'lonely',
  'angry',
  'frustrated',
  'hurt',
  'lost',
  'afraid',
  'scared',
  'heavy',
  'drained',
  'empty',
  'down',
];

const countHits = (text: string, words: string[]) =>
  words.reduce((total, word) => (text.includes(word) ? total + 1 : total), 0);

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const timeOfDayTag = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Morning reflection';
  if (hour < 18) return 'Afternoon reflection';
  return 'Evening reflection';
};

const moodLabelFor = (mood: number) => {
  if (mood >= 6.5) return 'Lighter';
  if (mood >= 4.5) return 'Mixed';
  return 'Heavier';
};

const stressLabelFor = (stress: number) => {
  if (stress >= 6.5) return 'High';
  if (stress >= 3.5) return 'Medium';
  return 'Low';
};

const insightFor = (group: DemoEmotionGroup, stress: number, emotion: string): string => {
  if (group === 'negative' && stress >= 6) {
    return 'A lot is asking for your attention at once. Writing it down is often how the weight starts to sort itself.';
  }
  if (group === 'negative' && emotion === 'Sadness') {
    return 'This reads tender and honest. You do not have to resolve it here — noticing it is already enough.';
  }
  if (group === 'negative') {
    return 'Your mind is moving fast. Putting the worry into words tends to slow it down enough to actually see it.';
  }
  if (group === 'positive' && stress < 3.5) {
    return 'You write more openly once something has gone right. Worth noticing what made room for it.';
  }
  if (group === 'positive') {
    return 'There is real lightness in how you said that. Naming it helps it stay a little longer.';
  }
  return 'Even a plain account of the day gives Eunoia something real to notice as your entries add up.';
};

/**
 * Produce a believable demo read for an arbitrary sentence of journaling.
 */
export const analyzeDemoEntry = (rawText: string): DemoAnalysis => {
  const text = rawText.trim().toLowerCase();

  let best: EmotionBucket | null = null;
  let bestScore = 0;
  for (const bucket of EMOTION_BUCKETS) {
    const score = countHits(text, bucket.keywords);
    if (score > bestScore) {
      best = bucket;
      bestScore = score;
    }
  }

  const emotion = best?.label ?? 'Reflective';
  const group: DemoEmotionGroup = best?.group ?? 'neutral';

  const positiveCount = countHits(text, POSITIVE_HINTS);
  const negativeCount = countHits(text, NEGATIVE_HINTS);
  const intensifiers = countHits(text, [
    'very',
    'really',
    'so',
    'extremely',
    'completely',
    'totally',
  ]);

  let mood = 5 + positiveCount * 1.1 - negativeCount * 1.2;
  if (group === 'positive') mood += 0.6;
  if (group === 'negative') mood -= 0.6;
  mood = round1(clamp(mood, 1, 9.6));

  const stressHits = countHits(text, STRESS_KEYWORDS);
  let stress = stressHits * 1.6 + (group === 'negative' ? 1.4 : 0) + intensifiers * 0.4;
  if (group === 'positive') stress -= 0.8;
  stress = round1(clamp(stress, 0.4, 9.4));

  const moodLabel = moodLabelFor(mood);
  const stressLabel = stressLabelFor(stress);

  return {
    emotion,
    emotionGroup: group,
    mood,
    moodLabel,
    stress,
    stressLabel,
    tags: [emotion, `${stressLabel} stress`, timeOfDayTag()],
    insight: insightFor(group, stress, emotion),
  };
};

/**
 * Default example shown before a visitor types anything, so the card is never empty.
 */
export const DEMO_EXAMPLE_QUOTE =
  'I felt stretched thin at first, but writing it down helped me notice I wasn’t as lost as I sounded in my head.';

export const DEMO_EXAMPLE_RESULT: DemoAnalysis = {
  emotion: 'Relief',
  emotionGroup: 'positive',
  mood: 6.8,
  moodLabel: 'Lighter',
  stress: 2.4,
  stressLabel: 'Low',
  tags: ['Relief', 'Low stress', 'Evening reflection'],
  insight: 'You tend to write more gently once you name what felt heavy first.',
};
