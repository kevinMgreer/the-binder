import { z } from "zod";
import type { Card } from "./card";

const required = z.string().trim().min(1, "Required");
const count = z.number().int().nonnegative();

const photoRef = z.object({ fileId: z.string().nullable(), thumbId: z.string().nullable() }).nullable();

export const cardSchema = z
  .object({
    id: z.string().min(1),
    player: required,
    team: z.string(),
    year: z.number({ error: "Enter a year" }).int("Enter a year").min(1800, "Enter a year"),
    manufacturer: z.string(),
    set: required,
    cardNumber: required,
    parallel: z
      .object({
        name: z.string(),
        serial: count.nullable(),
        serialLegible: z.boolean(),
        printRun: count.nullable(),
      })
      .nullable(),
    flags: z.object({ rookie: z.boolean(), autograph: z.boolean(), relic: z.boolean() }),
    grading: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("graded"), company: required, grade: required }),
      z.object({ kind: z.literal("raw"), condition: z.string() }),
    ]),
    quantity: z.number({ error: "Enter a quantity" }).int().min(1, "At least 1"),
    notes: z.string(),
    photos: z.object({ front: photoRef, back: photoRef }),
    source: z.enum(["manual", "ocr", "claude"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    deletedAt: z.string().nullable(),
  })
  .superRefine((card, ctx) => {
    const p = card.parallel;
    if (p && p.serial !== null && p.printRun !== null && p.serial > p.printRun) {
      ctx.addIssue({ code: "custom", path: ["parallel", "serial"], message: "Serial is above the print run" });
    }
  });

const fieldKeys = ["player", "year", "set", "cardNumber", "serial", "printRun", "grading", "quantity"] as const;
export type FieldKey = (typeof fieldKeys)[number] | "card";
export type FieldErrors = Partial<Record<FieldKey, string>>;

export function validateCard(card: Card): FieldErrors {
  const errors: FieldErrors = {};
  const result = cardSchema.safeParse(card);
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const [head, sub] = issue.path;
    const name = head === "parallel" ? (sub === "printRun" ? "printRun" : "serial") : String(head);
    const key = (fieldKeys as readonly string[]).includes(name) ? (name as FieldKey) : "card";
    errors[key] ??= issue.message;
  }
  return errors;
}
