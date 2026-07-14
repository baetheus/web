import * as T from "../../../tokens.ts";

export function TestPage() {
  return <h1>This is a test page</h1>;
}

export const test_route = T.client_route.create(TestPage);
