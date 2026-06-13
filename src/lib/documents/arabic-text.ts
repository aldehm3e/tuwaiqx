const ARABIC_CHAR_PATTERN = /[\u0600-\u06ff]/;
const ARABIC_TOKEN_PATTERN = /[\u0621-\u064a\u064b-\u065f\u0670\u0640]+/g;
const ARABIC_WORD_PATTERN = /[\u0621-\u064a]+/g;
const ARABIC_DEACRITICS_PATTERN = /[\u064b-\u065f\u0670\u0640]/g;

const COMMON_ARABIC_WORDS = new Set(
  [
    "في",
    "من",
    "على",
    "الى",
    "عن",
    "هذا",
    "هذه",
    "هو",
    "هي",
    "مع",
    "او",
    "لا",
    "نعم",
    "تم",
    "ان",
    "كل",
    "ما",
    "كم",
    "كيف",
    "متى",
    "لماذا",
    "أسئلة",
    "عام",
    "رقم",
    "تاريخ",
    "وتاريخ",
    "تصنيف",
    "الوثيقة",
    "المادة",
    "الأولى",
    "الثانية",
    "الثالثة",
    "الرابعة",
    "اللائحة",
    "النظام",
    "المعلومات",
    "تكون",
    "الألفاظ",
    "لأللفاظ",
    "بالألفاظ",
    "والعبارات",
    "الواردة",
    "المعاني",
    "المبين",
    "أمام",
    "منها",
    "تعديلاته",
    "وتعديلاته",
    "ويقصد",
    "أينما",
    "وردت",
    "الآتية",
    "الخدمات",
    "التقارير",
    "المنظمة",
    "البيانات",
    "الشخصية",
    "المملكة",
    "خارج",
    "نقل",
    "حماية",
    "الحماية",
    "المركز",
    "المختص",
    "المختصة",
    "جهة",
    "التحكم",
    "المعالجة",
    "صاحب",
    "الخدمة",
    "منفعة",
    "قائمة",
    "الرسمي",
    "الصادر",
    "المرسوم",
    "الملكي",
    "بحسب",
    "الأحوال",
    "الحد",
    "الأدنى",
    "بهدف",
    "ضمان",
    "مستوى",
    "المقرر",
    "الإجراءات",
    "العمليات",
    "التشغيلية",
    "الموارد",
    "البشرية",
    "الفواتير",
    "الحسابات",
    "العمل",
    "المتعلقة",
    "مثل",
    "لنشاط",
    "للبيانات",
    "الدعم",
    "الموقع",
    "التواصل",
    "التبرع",
    "التطوع",
    "الجامعة",
    "المدرسة",
    "الطلاب",
    "الطالب",
    "البرنامج",
    "البرامج"
  ].map(normalizeArabic)
);

const MIRRORED_PUNCTUATION: Record<string, string> = {
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<"
};

function normalizeArabic(value: string) {
  return value
    .replace(ARABIC_DEACRITICS_PATTERN, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه");
}

function reverseVisualOrder(value: string) {
  return Array.from(value)
    .reverse()
    .map((char) => MIRRORED_PUNCTUATION[char] || char)
    .join("");
}

function tidyRepairedArabic(value: string) {
  return value.replace(/\u0644\u0623\u0644\u0644/g, "\u0644\u0644\u0623\u0644");
}

function tidyPdfFragments(value: string) {
  return value
    .replace(/\u0627\u0644\u0626\u062d\u0629/g, "\u0644\u0627\u0626\u062d\u0629")
    .replace(/\u0629\u064a\u0640\s*\u0640+\u0635\u062e\u0640\s*\u0640+\u0634\u0644\u0627/g, "\u0627\u0644\u0634\u062e\u0635\u064a\u0629");
}

function arabicReadabilityScore(value: string) {
  const words = normalizeArabic(value).match(ARABIC_WORD_PATTERN) || [];
  let score = 0;

  for (const word of words) {
    if (COMMON_ARABIC_WORDS.has(word)) {
      score += 3;
    }

    if (/^(?:و|ف|ب|ك|ل)?ال[\u0621-\u064a]{2,}$/.test(word)) {
      score += 1;
    }

    if (/[\u0621-\u064a]{3,}لا$/.test(word)) {
      score -= 1;
    }
  }

  return score;
}

function shouldReverseArabicLine(line: string) {
  if (!ARABIC_CHAR_PATTERN.test(line)) {
    return false;
  }

  if (!/^[\s؟?!]/.test(line)) {
    return false;
  }

  const reversed = reverseVisualOrder(line);
  const originalScore = arabicReadabilityScore(line);
  const reversedScore = arabicReadabilityScore(reversed);

  return originalScore <= 0 && reversedScore > 0 && reversedScore >= originalScore + 2;
}

function shouldReverseArabicToken(token: string) {
  const normalized = normalizeArabic(token);
  const reversed = reverseVisualOrder(token);
  const reversedNormalized = normalizeArabic(reversed);

  if (normalized === reversedNormalized || COMMON_ARABIC_WORDS.has(normalized)) {
    return false;
  }

  if (/^(?:و|ف|ب|ك|ل)?ال[\u0621-\u064a]{2,}$/.test(normalized)) {
    return false;
  }

  if (COMMON_ARABIC_WORDS.has(reversedNormalized)) {
    return true;
  }

  const originalScore = arabicReadabilityScore(token);
  const reversedScore = arabicReadabilityScore(reversed);
  return reversedScore > 0 && reversedScore >= originalScore + 2;
}

function repairArabicTokens(value: string) {
  return tidyPdfFragments(
    value.replace(ARABIC_TOKEN_PATTERN, (token) =>
      shouldReverseArabicToken(token) ? tidyRepairedArabic(reverseVisualOrder(token)) : token
    )
  );
}

export function repairArabicTextDirection(text: string) {
  return text
    .split(/(\r?\n)/)
    .map((part) => {
      if (/^\r?\n$/.test(part)) {
        return part;
      }

      const line = shouldReverseArabicLine(part) ? reverseVisualOrder(part) : part;
      return repairArabicTokens(line);
    })
    .join("");
}
