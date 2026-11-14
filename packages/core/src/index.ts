// Shared domain primitives: money, dates, IDs, Result, errors.
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const MONEY = {
  toPaise: (rupees: number): number => Math.round(rupees * 100),
  toRupees: (paise: number): number => paise / 100,
} as const;
