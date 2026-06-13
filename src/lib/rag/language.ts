export type ResponseLanguage = "en" | "ar";

const ARABIC_CHAR_PATTERN = /[\u0600-\u06ff]/g;
const LATIN_CHAR_PATTERN = /[A-Za-z]/g;
const LETTER_PATTERN = /\p{L}/gu;

const DEFAULT_ENGLISH_FALLBACK = "I could not find that information in the approved knowledge base.";
const DEFAULT_ARABIC_FALLBACK =
  "\u0639\u0630\u0631\u064b\u0627\u060c \u0644\u0627 \u062a\u062a\u0648\u0641\u0631 \u0647\u0630\u0647 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0629 \u0641\u064a \u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0629.";

export function detectQuestionLanguage(question: string): ResponseLanguage | undefined {
  const letterCount = question.match(LETTER_PATTERN)?.length ?? 0;
  if (!letterCount) {
    return undefined;
  }

  const arabicCount = question.match(ARABIC_CHAR_PATTERN)?.length ?? 0;
  if (arabicCount >= 2 && arabicCount / letterCount >= 0.25) {
    return "ar";
  }

  const latinCount = question.match(LATIN_CHAR_PATTERN)?.length ?? 0;
  if (latinCount >= 2 && latinCount / letterCount >= 0.6) {
    return "en";
  }

  return undefined;
}

export function resolveResponseLanguage(input: {
  preferredLanguage?: ResponseLanguage;
  botLanguage?: string | null;
  question: string;
}): ResponseLanguage | undefined {
  const questionLanguage = detectQuestionLanguage(input.question);
  if (questionLanguage) {
    return questionLanguage;
  }

  if (input.preferredLanguage) {
    return input.preferredLanguage;
  }

  const botLanguage = input.botLanguage?.toLowerCase();
  if (botLanguage?.startsWith("ar")) {
    return "ar";
  }
  if (botLanguage?.startsWith("en")) {
    return "en";
  }

  return undefined;
}

export function fallbackForLanguage(fallbackMessage: string, language?: ResponseLanguage) {
  if (language === "ar" && fallbackMessage.trim() === DEFAULT_ENGLISH_FALLBACK) {
    return DEFAULT_ARABIC_FALLBACK;
  }

  return fallbackMessage;
}
