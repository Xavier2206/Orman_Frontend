export interface ProblemFieldError {
  readonly field: string;
  readonly message: string;
}

export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errorCode?: string;
  readonly timestamp?: string;
  readonly traceId?: string;
  readonly fieldErrors?: readonly ProblemFieldError[];
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null;
}
