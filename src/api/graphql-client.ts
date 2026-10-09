import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export type GraphQLError = {
  message: string;
  extensions?: { code?: string };
};

export type GraphQLResult<T> = {
  status: number;
  data?: T | null;
  errors?: GraphQLError[];
};

/**
 * Sends a GraphQL operation. Input always goes through `variables`, the
 * query text itself is a fixed string, so no user data is concatenated
 * into the query.
 */
export async function gql<T = unknown>(
  request: APIRequestContext,
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResult<T>> {
  const response: APIResponse = await request.post('/api', {
    data: { query, variables },
    headers: { 'Content-Type': 'application/json' },
  });
  const body = await response.json();
  return { status: response.status(), data: body.data, errors: body.errors };
}

export function expectNoErrors<T>(result: GraphQLResult<T>) {
  expect(result.status).toBe(200);
  expect(result.errors).toBeUndefined();
  expect(result.data).toBeTruthy();
}
