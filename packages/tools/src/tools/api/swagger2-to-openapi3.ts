import { z } from "zod";
import { defineTool } from "../../core/define-tool";
import { ToolTier } from "../../types";

const inputSchema = z.object({
  input: z.string().describe("Swagger 2.0 spec in JSON format"),
});

const outputSchema = z.object({
  output: z.string().describe("OpenAPI 3.0 spec in JSON format"),
});

type Input = z.infer<typeof inputSchema>;
type Output = z.infer<typeof outputSchema>;

function convertSchemaRef(ref: string): string {
  return ref.replace("#/definitions/", "#/components/schemas/");
}

function convertSchema(
  schema: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...schema };

  if (result.$ref && typeof result.$ref === "string") {
    result.$ref = convertSchemaRef(result.$ref);
  }

  if (result.items && typeof result.items === "object") {
    result.items = convertSchema(result.items as Record<string, unknown>);
  }

  if (result.properties && typeof result.properties === "object") {
    const converted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(
      result.properties as Record<string, unknown>
    )) {
      converted[key] = convertSchema(val as Record<string, unknown>);
    }
    result.properties = converted;
  }

  if (result.allOf && Array.isArray(result.allOf)) {
    result.allOf = result.allOf.map((s) =>
      convertSchema(s as Record<string, unknown>)
    );
  }

  return result;
}

function execute(input: Input): Output {
  if (!input.input.trim()) {
    throw new Error("Input cannot be empty");
  }

  let swagger: Record<string, unknown>;
  try {
    swagger = JSON.parse(input.input) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (!swagger.swagger || swagger.swagger !== "2.0") {
    throw new Error("Input must be a Swagger 2.0 spec (swagger: '2.0')");
  }

  const openapi: Record<string, unknown> = {
    openapi: "3.0.3",
  };

  // Convert info
  openapi.info = swagger.info ?? { title: "Converted API", version: "1.0.0" };

  // Convert servers from host/basePath/schemes
  const host = swagger.host as string | undefined;
  const basePath = (swagger.basePath as string | undefined) ?? "";
  const schemes = (swagger.schemes as string[] | undefined) ?? ["https"];

  if (host) {
    openapi.servers = schemes.map((scheme) => ({
      url: `${scheme}://${host}${basePath}`,
    }));
  }

  // Convert paths
  const swaggerPaths = swagger.paths as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (swaggerPaths) {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const [pathKey, methods] of Object.entries(swaggerPaths)) {
      paths[pathKey] = {};

      for (const [method, operation] of Object.entries(methods)) {
        if (method === "parameters") {
          paths[pathKey].parameters = operation;
          continue;
        }

        const op = operation as Record<string, unknown>;
        const newOp: Record<string, unknown> = {};

        if (op.summary) newOp.summary = op.summary;
        if (op.description) newOp.description = op.description;
        if (op.operationId) newOp.operationId = op.operationId;
        if (op.tags) newOp.tags = op.tags;
        if (op.deprecated) newOp.deprecated = op.deprecated;

        // Convert parameters -> separate body into requestBody
        const params = op.parameters as
          | Array<Record<string, unknown>>
          | undefined;
        if (params) {
          const nonBodyParams: Array<Record<string, unknown>> = [];
          let bodyParam: Record<string, unknown> | undefined;

          for (const param of params) {
            if (param.in === "body") {
              bodyParam = param;
            } else if (param.in === "formData") {
              // Handle formData -> requestBody
              if (!newOp.requestBody) {
                newOp.requestBody = {
                  content: {
                    "application/x-www-form-urlencoded": {
                      schema: { type: "object", properties: {} },
                    },
                  },
                };
              }
              const formSchema = (
                (newOp.requestBody as Record<string, unknown>)
                  .content as Record<
                  string,
                  Record<string, Record<string, unknown>>
                >
              )["application/x-www-form-urlencoded"]!.schema;
              (formSchema!.properties as Record<string, unknown>)[
                param.name as string
              ] = {
                type: param.type,
                description: param.description,
              };
            } else {
              const newParam: Record<string, unknown> = {
                name: param.name,
                in: param.in,
              };
              if (param.description) newParam.description = param.description;
              if (param.required) newParam.required = param.required;
              if (param.type) {
                newParam.schema = { type: param.type };
                if (param.format)
                  (newParam.schema as Record<string, unknown>).format =
                    param.format;
                if (param.enum)
                  (newParam.schema as Record<string, unknown>).enum =
                    param.enum;
                if (param.default !== undefined)
                  (newParam.schema as Record<string, unknown>).default =
                    param.default;
              }
              nonBodyParams.push(newParam);
            }
          }

          if (nonBodyParams.length > 0) newOp.parameters = nonBodyParams;

          if (bodyParam) {
            const consumes = (op.consumes ??
              swagger.consumes ?? ["application/json"]) as string[];
            const content: Record<string, unknown> = {};
            for (const mime of consumes) {
              content[mime] = {
                schema: bodyParam.schema
                  ? convertSchema(bodyParam.schema as Record<string, unknown>)
                  : {},
              };
            }
            newOp.requestBody = {
              description: bodyParam.description,
              required: bodyParam.required ?? false,
              content,
            };
          }
        }

        // Convert responses
        const responses = op.responses as
          | Record<string, Record<string, unknown>>
          | undefined;
        if (responses) {
          const newResponses: Record<string, Record<string, unknown>> = {};
          const produces = (op.produces ??
            swagger.produces ?? ["application/json"]) as string[];

          for (const [status, response] of Object.entries(responses)) {
            const newResponse: Record<string, unknown> = {
              description: response.description ?? "",
            };

            if (response.schema) {
              const content: Record<string, unknown> = {};
              for (const mime of produces) {
                content[mime] = {
                  schema: convertSchema(
                    response.schema as Record<string, unknown>
                  ),
                };
              }
              newResponse.content = content;
            }

            if (response.headers) {
              newResponse.headers = response.headers;
            }

            newResponses[status] = newResponse;
          }

          newOp.responses = newResponses;
        }

        paths[pathKey][method] = newOp;
      }
    }

    openapi.paths = paths;
  }

  // Convert definitions -> components/schemas
  const definitions = swagger.definitions as
    | Record<string, unknown>
    | undefined;
  if (definitions) {
    const schemas: Record<string, unknown> = {};
    for (const [name, schema] of Object.entries(definitions)) {
      schemas[name] = convertSchema(schema as Record<string, unknown>);
    }
    openapi.components = { schemas };
  }

  // Convert securityDefinitions -> components/securitySchemes
  const secDefs = swagger.securityDefinitions as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (secDefs) {
    const secSchemes: Record<string, unknown> = {};
    for (const [name, def] of Object.entries(secDefs)) {
      if (def.type === "basic") {
        secSchemes[name] = { type: "http", scheme: "basic" };
      } else if (def.type === "apiKey") {
        secSchemes[name] = { type: "apiKey", in: def.in, name: def.name };
      } else if (def.type === "oauth2") {
        const flows: Record<string, unknown> = {};
        const flow = def.flow as string;
        const flowObj: Record<string, unknown> = {};
        if (def.authorizationUrl)
          flowObj.authorizationUrl = def.authorizationUrl;
        if (def.tokenUrl) flowObj.tokenUrl = def.tokenUrl;
        if (def.scopes) flowObj.scopes = def.scopes;

        if (flow === "implicit") flows.implicit = flowObj;
        else if (flow === "password") flows.password = flowObj;
        else if (flow === "application") flows.clientCredentials = flowObj;
        else if (flow === "accessCode") flows.authorizationCode = flowObj;

        secSchemes[name] = { type: "oauth2", flows };
      }
    }
    if (!openapi.components) openapi.components = {};
    (openapi.components as Record<string, unknown>).securitySchemes =
      secSchemes;
  }

  if (swagger.security) openapi.security = swagger.security;
  if (swagger.tags) openapi.tags = swagger.tags;
  if (swagger.externalDocs) openapi.externalDocs = swagger.externalDocs;

  return { output: JSON.stringify(openapi, null, 2) };
}

export const swagger2ToOpenapi3 = defineTool({
  meta: {
    id: "api/swagger2-to-openapi3",
    name: "Swagger 2.0 to OpenAPI 3.0",
    description:
      "Free online Swagger 2.0 to OpenAPI 3.0 converter — upgrade Swagger specs to OpenAPI 3.0.3 format instantly in your browser. No data is stored. Converts paths, definitions to components, security schemes, body parameters to requestBody, and produces/consumes to content types.",
    category: "api",
    subgroup: "OpenAPI",
    tier: ToolTier.CLIENT,
    keywords: [
      "swagger",
      "openapi",
      "convert",
      "migrate",
      "upgrade",
      "api",
      "v2",
      "v3",
    ],
    ui: { inputLanguage: "json", outputLanguage: "json" },
    examples: [
      {
        title: "Upgrade Pet Store Swagger",
        description:
          "Convert a Swagger 2.0 Pet Store spec to OpenAPI 3.0 format",
        input:
          '{"swagger":"2.0","info":{"title":"Pet Store","version":"1.0.0"},"host":"api.example.com","basePath":"/v1","schemes":["https"],"paths":{"/pets":{"get":{"summary":"List pets","produces":["application/json"],"responses":{"200":{"description":"OK"}}}}},"definitions":{"Pet":{"type":"object","properties":{"id":{"type":"integer"},"name":{"type":"string"}}}}}',
        output:
          '{\n  "openapi": "3.0.3",\n  "info": {\n    "title": "Pet Store",\n    "version": "1.0.0"\n  },\n  "servers": [\n    {\n      "url": "https://api.example.com/v1"\n    }\n  ],\n  "paths": {\n    "/pets": {\n      "get": {\n        "summary": "List pets",\n        "responses": {\n          "200": {\n            "description": "OK"\n          }\n        }\n      }\n    }\n  },\n  "components": {\n    "schemas": {\n      "Pet": {\n        "type": "object",\n        "properties": {\n          "id": {\n            "type": "integer"\n          },\n          "name": {\n            "type": "string"\n          }\n        }\n      }\n    }\n  }\n}',
      },
    ],
  },
  inputSchema,
  outputSchema,
  execute,
});
