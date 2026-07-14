import * as Tokens from "../../tokens.ts";
import * as Router from "../../router.ts";

export const getUsers = Tokens.get(() =>
  Router.json(JSON.stringify({ users: [] }))
);

export const createUser = Tokens.post(() =>
  Router.json(JSON.stringify({ id: 1 }))
);

export const deleteUser = Tokens.del(() => Router.text("Deleted"));
