import * as Tokens from "../../tokens.ts";
import * as Router from "../../router.ts";

export const hello = Tokens.get(() => Router.text("Hello from server route"));
