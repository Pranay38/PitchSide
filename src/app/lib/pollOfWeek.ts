export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollOfWeek {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  question: string;
  options: PollOption[];
  updatedAt: string;
}

export function createDefaultPollOfWeek(): PollOfWeek {
  return {
    id: "",
    enabled: false,
    title: "Poll of the Week",
    description: "",
    question: "",
    options: [
      { id: "option-1", text: "", votes: 0 },
      { id: "option-2", text: "", votes: 0 },
    ],
    updatedAt: "",
  };
}

function clampVotes(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed);
}

export function normalizePollOfWeek(input?: Partial<PollOfWeek> | null): PollOfWeek {
  const fallback = createDefaultPollOfWeek();
  const rawOptions = Array.isArray(input?.options) ? input!.options : fallback.options;
  const options = rawOptions.slice(0, 5).map((option, index) => ({
    id: String(option?.id || `option-${index + 1}`),
    text: String(option?.text || ""),
    votes: clampVotes(option?.votes),
  }));

  while (options.length < 2) {
    options.push({
      id: `option-${options.length + 1}`,
      text: "",
      votes: 0,
    });
  }

  return {
    id: String(input?.id || fallback.id),
    enabled: input?.enabled ?? fallback.enabled,
    title: String(input?.title || fallback.title),
    description: String(input?.description || fallback.description),
    question: String(input?.question || fallback.question),
    options,
    updatedAt: String(input?.updatedAt || fallback.updatedAt),
  };
}

export function getFilledPollOptions(options: PollOption[]): PollOption[] {
  return options.filter((option) => option.text.trim().length > 0);
}

export function isPollOfWeekActive(poll?: Partial<PollOfWeek> | null): poll is PollOfWeek {
  if (!poll) return false;
  const normalized = normalizePollOfWeek(poll);
  return normalized.enabled && normalized.question.trim().length > 0 && getFilledPollOptions(normalized.options).length >= 2;
}
