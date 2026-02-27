export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error('invalid_json');
  }
}

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}
