// Basic profanity filter — blocks common inappropriate words
const BLOCKED_WORDS = [
  "fuck","shit","ass","bitch","dick","pussy","cock","cunt","nigger","nigga",
  "faggot","fag","retard","whore","slut","bastard","damn","piss","bollocks",
  "wanker","twat","arse","porn","sex","penis","vagina","boob","tits","anal",
  "rape","kill","die","nazi","hitler","cum","jizz","dildo","horny","nude",
  "naked","xxx","onlyfans","hentai","milf","thot","simp",
];

// Also block leet-speak common variants
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s",
};

function deLeet(text: string): string {
  return text.split("").map(c => LEET_MAP[c] || c).join("");
}

export function isInappropriate(username: string): boolean {
  const cleaned = deLeet(username.toLowerCase().replace(/[^a-z0-9@$]/gi, ""));
  return BLOCKED_WORDS.some(word => cleaned.includes(word));
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 2) return { valid: false, error: "Username must be at least 2 characters" };
  if (trimmed.length > 20) return { valid: false, error: "Username must be 20 characters or less" };
  if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed)) return { valid: false, error: "Only letters, numbers, spaces, _ - . allowed" };
  if (isInappropriate(trimmed)) return { valid: false, error: "This username is not allowed" };
  return { valid: true };
}
