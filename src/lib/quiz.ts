import { formatBirth } from "@/lib/numerology";

export type QuizAnswers = Record<string, string>;

export type FieldType = "text" | "date" | "textarea" | "radio";

export interface FieldOption {
  id: string;
  label: string;
  /** Points this option adds to each result type. */
  score?: Record<string, number>;
}

export interface QuizField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  help?: string;
  required: boolean;
  /** Lay the radio buttons out in two columns. */
  columns?: number;
  /** Include this answer in the short summary shown on /result. */
  summary?: boolean;
  options?: FieldOption[];
}

export const FIELDS: QuizField[] = [
  {
    "id": "name",
    "type": "text",
    "label": "Как вас зовут",
    "placeholder": "Имя",
    "required": true,
    "summary": true
  },
  {
    "id": "birth",
    "type": "date",
    "label": "Дата рождения",
    "help": "Нужна для расчёта числа судьбы и нумерологического слоя разбора.",
    "required": true,
    "summary": true
  },
  {
    "id": "q1",
    "type": "radio",
    "label": "1. Как вы бы описали своё состояние точнее всего?",
    "required": true,
    "options": [
      {
        "id": "a",
        "label": "Всё есть, но непонятно зачем",
        "score": {
          "existential": 3
        }
      },
      {
        "id": "b",
        "label": "Ничего не чувствую, как за стеклом",
        "score": {
          "emotional": 3
        }
      },
      {
        "id": "c",
        "label": "Нет сил, всё тянется через силу",
        "score": {
          "energy": 3
        }
      }
    ]
  },
  {
    "id": "q2",
    "type": "radio",
    "label": "2. Что происходит с делами, которые раньше радовали?",
    "required": true,
    "options": [
      {
        "id": "a",
        "label": "Делаю, но не понимаю, ради чего",
        "score": {
          "existential": 3
        }
      },
      {
        "id": "b",
        "label": "Делаю и ничего не чувствую",
        "score": {
          "emotional": 3
        }
      },
      {
        "id": "c",
        "label": "Не берусь — не хватает сил",
        "score": {
          "energy": 3
        }
      }
    ]
  },
  {
    "id": "q3",
    "type": "radio",
    "label": "3. Когда это началось?",
    "required": true,
    "options": [
      {
        "id": "a",
        "label": "После того, как достигла важной цели",
        "score": {
          "existential": 3
        }
      },
      {
        "id": "b",
        "label": "После тяжёлого события или потери",
        "score": {
          "emotional": 3
        }
      },
      {
        "id": "c",
        "label": "После долгого периода перегрузки",
        "score": {
          "energy": 3
        }
      }
    ]
  },
  {
    "id": "q4",
    "type": "radio",
    "label": "4. Что происходит после хорошего отдыха?",
    "required": true,
    "options": [
      {
        "id": "a",
        "label": "Отдохнула, но вопрос «зачем» остался",
        "score": {
          "existential": 3
        }
      },
      {
        "id": "b",
        "label": "Ничего не изменилось, чувств по-прежнему нет",
        "score": {
          "emotional": 3
        }
      },
      {
        "id": "c",
        "label": "Становится заметно легче",
        "score": {
          "energy": 3
        }
      }
    ]
  },
  {
    "id": "q5",
    "type": "radio",
    "label": "5. Чего вам сейчас не хватает больше всего?",
    "required": true,
    "options": [
      {
        "id": "a",
        "label": "Понимания, куда я иду",
        "score": {
          "existential": 3
        }
      },
      {
        "id": "b",
        "label": "Живых чувств и близости",
        "score": {
          "emotional": 3
        }
      },
      {
        "id": "c",
        "label": "Обычных сил и времени",
        "score": {
          "energy": 3
        }
      }
    ]
  }
];

/** Radio fields start unselected on purpose — the answer has to be a real one. */
export const DEFAULTS: QuizAnswers = {};

const BY_ID = new Map(FIELDS.map((field) => [field.id, field]));

export function labelFor(fieldId: string, value: string): string {
  const field = BY_ID.get(fieldId);
  if (!field) return value;
  if (field.type === "date") return formatBirth(value);
  if (field.type !== "radio") return value;
  return field.options?.find((option) => option.id === value)?.label ?? value;
}

/** Returns the first problem found, or null when the form is ready to submit. */
export function validate(answers: QuizAnswers): string | null {
  for (const field of FIELDS) {
    if (!field.required) continue;
    const value = (answers[field.id] ?? "").trim();
    if (!value) {
      return field.type === "radio"
        ? `Выберите вариант: ${field.label}`
        : `Заполните поле: ${field.label}`;
    }
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "Укажите дату рождения полностью";
    }
  }
  return null;
}

/** Sums the per-option weights into a score for each result type. */
export function scoreAnswers(answers: QuizAnswers): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const field of FIELDS) {
    if (field.type !== "radio") continue;
    const chosen = field.options?.find((option) => option.id === answers[field.id]);
    if (!chosen?.score) continue;
    for (const [type, points] of Object.entries(chosen.score)) {
      totals[type] = (totals[type] ?? 0) + points;
    }
  }
  return totals;
}

/** Every answered field, written out for the PDF. */
export function describeAnswers(answers: QuizAnswers): string[] {
  const lines: string[] = [];
  for (const field of FIELDS) {
    const value = (answers[field.id] ?? "").trim();
    if (!value) continue;
    lines.push(`${field.label}: ${labelFor(field.id, value)}`);
  }
  return lines;
}

/** The one-line version shown under the free teaser on /result. */
export function summaryAnswers(answers: QuizAnswers): string[] {
  const lines: string[] = [];
  for (const field of FIELDS) {
    if (!field.summary) continue;
    const value = (answers[field.id] ?? "").trim();
    if (!value) continue;
    lines.push(labelFor(field.id, value));
  }
  return lines;
}
