// Relative URL: Vite passes /graphql on to the API (see vite.config.js)
const GRAPHQL_URL = '/graphql';

// Validation errors keep their real messages in originalError (as an array);
// other errors have a readable message directly.
function getErrorMessage(error)
{
    const details = error.extensions?.originalError?.message;

    if (Array.isArray(details))
    {
        return details.join(', ');
    }
    return error.message || 'Something went wrong';
}

async function graphqlRequest(query, variables) {
  let body;
  try
  {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    body = await response.json();
  }
  catch
  {
    // No answer at all, or not a GraphQL answer (e.g. the API is stopped and Vite's proxy replied instead)
    throw new Error("Can't reach the server. Check that it's running, then try again.");
  }

  // GraphQL often answers 200 even when it fails, so check errors, not response.ok
  if (body.errors)
  {
    const err = new Error(getErrorMessage(body.errors[0]));
    err.code = body.errors[0].extensions?.code;
    throw err;
  }
  return body.data;
}

// The one user (single-user mode). Used on start-up to check the API and database are reachable.
export async function getMe()
{
    const data = await graphqlRequest('query { me { id timezone } }');
    return data.me;
}
