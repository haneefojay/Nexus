export const apiVersion = "v1" as const;

export interface ApiErrorDetail {
  field?: string;
  reason: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[] | Record<string, unknown>;
    requestId: string;
  };
}

export interface CursorPage<T> {
  data: T[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}
