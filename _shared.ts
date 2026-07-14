import * as Path from "@std/path";

export function strip_extension(path: string): string {
  const parsed_path = Path.parse(Path.normalize(path));
  return Path.join(parsed_path.dir, parsed_path.name);
}
