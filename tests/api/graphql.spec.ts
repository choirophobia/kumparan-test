import { test, expect } from '@playwright/test';
import { gql, expectNoErrors } from '../../src/api/graphql-client';
import {
  CREATE_POST,
  DELETE_POST,
  GET_POST,
  GET_TODO,
  GET_USER,
  LIST_POSTS,
  UPDATE_POST,
  USER_ALBUMS,
} from '../../src/api/queries';

// GraphQLZero (https://graphqlzero.almansi.me) is a public fake API based on
// JSONPlaceholder. It has no authentication, so there are no auth tests.
// Mutations are accepted but not saved, so we only check the echoed result.

type Post = { id: string; title: string; body: string; user: { id: string; name: string } };
type User = { id: string; name: string; username: string; email: string; address: { city: string } };
type Page<T> = { data: T[]; meta: { totalCount: number } };

test.describe('GraphQL queries', () => {
  test('GQL-001 get a single post by id', async ({ request }) => {
    const result = await gql<{ post: Post }>(request, GET_POST, { id: '1' });

    expectNoErrors(result);
    expect(result.data!.post).toMatchObject({ id: '1', user: { id: '1' } });
    expect(result.data!.post.title).not.toBe('');
    expect(result.data!.post.body).not.toBe('');
  });

  test('GQL-002 get a user with nested address', async ({ request }) => {
    const result = await gql<{ user: User }>(request, GET_USER, { id: '1' });

    expectNoErrors(result);
    expect(result.data!.user).toMatchObject({ id: '1', username: 'Bret' });
    expect(result.data!.user.email).toMatch(/^[^@\s]+@[^@\s]+$/);
    expect(result.data!.user.address.city).toBeTruthy();
  });

  test('GQL-003 list posts with pagination', async ({ request }) => {
    const result = await gql<{ posts: Page<{ id: string; title: string }> }>(request, LIST_POSTS, {
      options: { paginate: { page: 2, limit: 5 } },
    });

    expectNoErrors(result);
    const posts = result.data!.posts;
    expect(posts.data).toHaveLength(5);
    expect(posts.data.map((p) => p.id)).toEqual(['6', '7', '8', '9', '10']);
    expect(posts.meta.totalCount).toBe(100);
  });

  test('GQL-004 list a user\'s albums (nested query with variables)', async ({ request }) => {
    const result = await gql<{ user: { id: string; albums: Page<{ id: string }> } }>(request, USER_ALBUMS, {
      id: '1',
      options: { paginate: { page: 1, limit: 3 } },
    });

    expectNoErrors(result);
    expect(result.data!.user.albums.data).toHaveLength(3);
    expect(result.data!.user.albums.meta.totalCount).toBe(10);
  });

  test('GQL-005 search posts by title', async ({ request }) => {
    const result = await gql<{ posts: Page<{ id: string; title: string }> }>(request, LIST_POSTS, {
      options: { search: { q: 'qui est esse' } },
    });

    expectNoErrors(result);
    expect(result.data!.posts.data.length).toBeGreaterThan(0);
    for (const post of result.data!.posts.data) {
      expect(post.title.toLowerCase()).toContain('qui est esse');
    }
  });

  test('GQL-006 get a todo and check field types', async ({ request }) => {
    const result = await gql<{ todo: { id: string; title: string; completed: boolean } }>(request, GET_TODO, { id: '1' });

    expectNoErrors(result);
    expect(typeof result.data!.todo.completed).toBe('boolean');
    expect(typeof result.data!.todo.title).toBe('string');
  });
});

test.describe('GraphQL mutations', () => {
  test('GQL-007 create a post echoes the input', async ({ request }) => {
    const input = { title: 'QA test title', body: 'QA test body' };
    const result = await gql<{ createPost: { id: string; title: string; body: string } }>(request, CREATE_POST, { input });

    expectNoErrors(result);
    expect(result.data!.createPost).toMatchObject(input);
    expect(result.data!.createPost.id).toBeTruthy();
  });

  test('GQL-008 update a post echoes the new body', async ({ request }) => {
    const result = await gql<{ updatePost: { id: string; body: string } }>(request, UPDATE_POST, {
      id: '1',
      input: { body: 'Updated by QA' },
    });

    expectNoErrors(result);
    expect(result.data!.updatePost).toEqual({ id: '1', body: 'Updated by QA' });
  });

  test('GQL-009 delete a post returns true', async ({ request }) => {
    const result = await gql<{ deletePost: boolean }>(request, DELETE_POST, { id: '1' });

    expectNoErrors(result);
    expect(result.data!.deletePost).toBe(true);
  });
});

test.describe('GraphQL negative cases', () => {
  test('GQL-010 unknown id returns empty fields, not an error', async ({ request }) => {
    const result = await gql<{ post: Post }>(request, GET_POST, { id: '99999' });

    expect(result.status).toBe(200);
    expect(result.errors).toBeUndefined();
    // GraphQLZero returns an object with null fields instead of post: null
    expect(result.data!.post.id).toBeNull();
    expect(result.data!.post.title).toBeNull();
  });

  test('GQL-011 missing required variable gives BAD_USER_INPUT', async ({ request }) => {
    const result = await gql(request, GET_POST);

    expect(result.data).toBeUndefined();
    expect(result.errors?.[0].message).toContain('Variable "$id" of required type "ID!" was not provided');
    expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
  });

  test('GQL-012 variable with the wrong type is rejected', async ({ request }) => {
    const result = await gql(request, LIST_POSTS, { options: { paginate: { page: 'two', limit: 5 } } });

    expect(result.data).toBeUndefined();
    expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
  });

  test('GQL-013 unknown field fails validation with HTTP 400', async ({ request }) => {
    const result = await gql(request, 'query { post(id: 1) { id doesNotExist } }');

    expect(result.status).toBe(400);
    expect(result.data).toBeUndefined();
    expect(result.errors?.[0].message).toContain('Cannot query field "doesNotExist" on type "Post"');
    expect(result.errors?.[0].extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });

  test('GQL-014 broken query syntax fails parsing with HTTP 400', async ({ request }) => {
    const result = await gql(request, 'query { post(id: 1 { id }');

    expect(result.status).toBe(400);
    expect(result.errors?.[0].extensions?.code).toBe('GRAPHQL_PARSE_FAILED');
  });

  test('GQL-015 injection text in a variable is treated as plain data', async ({ request }) => {
    const input = { title: '"){ id } } mutation { deletePost(id: 1) }', body: "' OR 1=1--" };
    const result = await gql<{ createPost: { title: string; body: string } }>(request, CREATE_POST, { input });

    expectNoErrors(result);
    expect(result.data!.createPost.title).toBe(input.title);
    expect(result.data!.createPost.body).toBe(input.body);
  });

  test('GQL-016 mutation with a missing required input field is rejected', async ({ request }) => {
    const result = await gql(request, CREATE_POST, { input: { body: 'no title' } });

    expect(result.data).toBeUndefined();
    expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
  });
});
