export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths: {
    [path: string]: {
      [method: string]: {
        operationId?: string;
        summary?: string;
        description?: string;
        parameters?: any[];
        requestBody?: any;
        responses?: any;
      };
    };
  };
  components?: {
    schemas?: any;
    securitySchemes?: any;
  };
}

export interface ToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: any;
  };
  _meta: {
    path: string;
  };
}

// Parse OpenAPI spec and convert to Tools Schema
export function parseOpenAPIToToolsSchema(schema: OpenAPISpec): ToolSchema[] {
  const tools: ToolSchema[] = [];

  for (const [path, pathItem] of Object.entries(schema.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      // Only get methods are supported
      if (method === "parameters" || !["get"].includes(method.toLowerCase())) {
        continue;
      }

      const operationId =
        operation.operationId || `${method}_${path.replace(/\//g, "_")}`;
      const description =
        operation.summary ||
        operation.description ||
        `${method.toUpperCase()} ${path}`;

      // Parse parameters
      const properties: any = {};
      const required: string[] = [];

      if (operation.parameters) {
        for (const param of operation.parameters) {
          properties[param.name] = {
            type: param.schema?.type || "string",
            description: param.description || "",
          };

          if (param.required) {
            required.push(param.name);
          }
        }
      }

      // Parse request body
      if (operation.requestBody?.content?.["application/json"]?.schema) {
        const bodySchema =
          operation.requestBody.content["application/json"].schema;

        if (bodySchema.properties) {
          for (const [propName, propSchema] of Object.entries(
            bodySchema.properties
          )) {
            properties[propName] = propSchema;
          }
        }

        if (bodySchema.required) {
          required.push(...bodySchema.required);
        }
      }

      tools.push({
        type: "function",
        function: {
          name: operationId,
          description: description,
          parameters: {
            type: "object",
            properties: properties,
            required: required.length > 0 ? required : undefined,
          },
        },
        _meta: {
          path: path,
        },
      });
    }
  }

  return tools;
}
