/**
 * OpenAPI 3.1.0 specification builder for Pick routes.
 *
 * @module
 * @since 0.4.0
 */

import type { Schema } from "@baetheus/fun/schemable";

import * as JsonSchema from "@baetheus/fun/json_schema";

import * as Path from "@std/path";

import type * as Builder from "./builder.ts";
import * as Router from "./router.ts";

/**
 * OpenAPI Info Object as per OpenAPI 3.1.0 specification.
 *
 * @since 0.4.0
 */
export type OpenAPIInfo = {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
};

/**
 * OpenAPI Server Object as per OpenAPI 3.1.0 specification.
 *
 * @since 0.4.0
 */
export type OpenAPIServer = {
  readonly url: string;
  readonly description?: string;
};

/**
 * Configuration options for the OpenAPI plugin.
 *
 * @since 0.4.0
 */
export type OpenAPIPluginOptions = {
  readonly name?: string;
  readonly path?: string;
  readonly info: OpenAPIInfo;
  readonly servers?: readonly OpenAPIServer[];
};

type ParameterObject = {
  readonly name: string;
  readonly in: "path" | "query" | "header" | "cookie";
  readonly required?: boolean;
  readonly schema?: JsonSchema.JsonSchema;
  readonly description?: string;
};

type RequestBodyObject = {
  readonly required?: boolean;
  readonly content: {
    readonly [mediaType: string]: {
      readonly schema: JsonSchema.JsonSchema;
    };
  };
};

type ResponseObject = {
  readonly description: string;
  readonly content?: {
    readonly [mediaType: string]: {
      readonly schema?: JsonSchema.JsonSchema;
    };
  };
};

type OperationObject = {
  readonly operationId?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly parameters?: readonly ParameterObject[];
  readonly requestBody?: RequestBodyObject;
  readonly responses: {
    readonly [statusCode: string]: ResponseObject;
  };
};

type PathItemObject = {
  readonly get?: OperationObject;
  readonly post?: OperationObject;
  readonly put?: OperationObject;
  readonly delete?: OperationObject;
  readonly patch?: OperationObject;
  readonly head?: OperationObject;
  readonly options?: OperationObject;
};

type JsonSchemaType = {
  readonly type?: string;
  readonly properties?: { readonly [key: string]: JsonSchemaType };
  readonly items?: JsonSchema.JsonSchema;
  readonly required?: readonly string[];
  readonly description?: string;
  readonly format?: string;
  readonly enum?: readonly unknown[];
  readonly $ref?: string;
};

type OpenAPIDocument = {
  readonly openapi: "3.1.0";
  readonly info: OpenAPIInfo;
  readonly servers?: readonly OpenAPIServer[];
  readonly paths: { readonly [path: string]: PathItemObject };
};

function convert_path_to_openapi(pathname: string): string {
  return pathname.replace(/:([^/]+)/g, "{$1}");
}

function extract_path_parameters(pathname: string): string[] {
  const matches = pathname.match(/:([^/]+)/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1));
}

function schema_to_json_schema<A>(schema: Schema<A>): JsonSchema.JsonSchema {
  const JsonBuilder = schema(JsonSchema.SchemableJsonBuilder);
  return JsonSchema.print(JsonBuilder);
}

function method_to_lower_case(
  method: Router.Methods,
): "get" | "post" | "put" | "delete" | "patch" | "head" | "options" {
  const lower = method.toLowerCase();
  if (
    lower === "get" || lower === "post" || lower === "put" ||
    lower === "delete" || lower === "patch" || lower === "head" ||
    lower === "options"
  ) {
    return lower;
  }
  return "get";
}

function generate_operation_id(method: string, pathname: string): string {
  const sanitizedPath = pathname
    .replace(/^\//, "")
    .replace(/[{}:]/g, "")
    .replace(/\//g, "_")
    .replace(/-/g, "_");
  return `${method.toLowerCase()}_${sanitizedPath || "root"}`;
}

function build_operation_object(
  route: Builder.FullRoute,
): OperationObject {
  const pathParams = extract_path_parameters(route.route.pathname);

  const parameters: ParameterObject[] = pathParams.map((name) => ({
    name,
    in: "path" as const,
    required: true,
    schema: { type: "string" },
  }));

  const requestBody = route.body_schema
    ? {
      required: true,
      content: {
        "application/json": {
          schema: schema_to_json_schema(route.body_schema),
        },
      },
    } as RequestBodyObject
    : undefined;

  const responseSchema = route.output_schema
    ? schema_to_json_schema(route.output_schema)
    : undefined;

  const responses: { [statusCode: string]: ResponseObject } = {
    "200": {
      description: "Successful response",
      ...(responseSchema
        ? {
          content: {
            "application/json": {
              schema: responseSchema,
            },
          },
        }
        : {}),
    },
  };

  return {
    operationId: generate_operation_id(
      route.route.method,
      route.route.pathname,
    ),
    parameters: parameters.length > 0 ? parameters : undefined,
    requestBody,
    responses,
  };
}

/**
 * Creates an OpenAPI plugin that generates an OpenAPI 3.1.0 specification
 * from all routes and serves it at a configurable path.
 *
 * @example
 * ```ts
 * import { openapi_plugin } from "@baetheus/pick/plugin_openapi";
 *
 * const plugin = openapi_plugin({
 *   info: { title: "My API", version: "1.0.0" },
 *   servers: [{ url: "https://api.example.com" }],
 * });
 * ```
 *
 * @since 0.4.0
 */
export function openapi_plugin(
  {
    name = "OpenAPIPlugin",
    path = "/openapi.json",
    info,
    servers,
  }: OpenAPIPluginOptions,
): Builder.Plugin {
  return {
    name,
    init: () => null,
    process_file: async () => [],
    process_build: async (_state, routes) => [
      {
        plugin: name,
        absolute_path: path,
        parsed_path: Path.parse(path),
        route: Router.route(
          "GET",
          path,
          () => {
            const paths: { [path: string]: PathItemObject } = {};

            for (const route of routes) {
              if (route.plugin === name) continue;

              const openApiPath = convert_path_to_openapi(
                route.route.pathname,
              );
              const method = method_to_lower_case(route.route.method);
              const operation = build_operation_object(route);

              if (!paths[openApiPath]) {
                paths[openApiPath] = {};
              }

              (paths[openApiPath] as { [key: string]: OperationObject })[
                method
              ] = operation;
            }

            const document: OpenAPIDocument = {
              openapi: "3.1.0",
              info,
              ...(servers && servers.length > 0 ? { servers } : {}),
              paths,
            };

            return Router.json(JSON.stringify(document, null, 2));
          },
        ),
      },
    ],
  };
}
