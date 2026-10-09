export const GET_POST = `
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      body
      user { id name }
    }
  }
`;

export const GET_USER = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      username
      email
      address { city }
    }
  }
`;

export const LIST_POSTS = `
  query ListPosts($options: PageQueryOptions) {
    posts(options: $options) {
      data { id title }
      meta { totalCount }
    }
  }
`;

export const USER_ALBUMS = `
  query UserAlbums($id: ID!, $options: PageQueryOptions) {
    user(id: $id) {
      id
      albums(options: $options) {
        data { id title }
        meta { totalCount }
      }
    }
  }
`;

export const GET_TODO = `
  query GetTodo($id: ID!) {
    todo(id: $id) {
      id
      title
      completed
    }
  }
`;

export const CREATE_POST = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      body
    }
  }
`;

export const UPDATE_POST = `
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      body
    }
  }
`;

export const DELETE_POST = `
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;
