/**
 * API Contracts for Tool Engine
 *
 * These schemas define the REST API contracts for tool execution
 * and registry access. Used by both web app and MCP server.
 *
 * @packageDocumentation
 */

import { z } from "zod";
import { ToolTier } from "../types";

// =============================================================================
// Base Schemas
// =============================================================================

/**
 * Schema for tool ID validation.
 * Tool IDs follow the pattern: category/tool-name
 * Category: lowercase letters only
 * Tool name: lowercase letters, digits, and hyphens
 */
export const toolIdSchema = z
  .string()
  .regex(
    /^[a-z]+\/[a-z0-9-]+$/,
    "Tool ID must match pattern: category/tool-name"
  );

/**
 * Schema for category ID validation.
 */
export const categoryIdSchema = z
  .string()
  .regex(
    /^[a-z-]+$/,
    "Category ID must contain only lowercase letters and hyphens"
  );

/**
 * Schema for tool tier validation.
 */
export const toolTierSchema = z.nativeEnum(ToolTier);

/**
 * Schema for credit configuration.
 */
export const creditConfigSchema = z.object({
  /** Base credit cost */
  base: z.number().min(0),
  /** Additional credits per KB of input */
  perKb: z.number().min(0).optional(),
  /** Input size threshold (KB) before perKb applies */
  threshold: z.number().min(0).optional(),
  /** Maximum credit cost cap */
  max: z.number().min(0).optional(),
});

/**
 * Schema for tool metadata.
 */
export const toolMetaSchema = z.object({
  /** Unique tool identifier (category/tool-name) */
  id: toolIdSchema,
  /** Display name */
  name: z.string().min(1),
  /** Tool description */
  description: z.string().min(1),
  /** Category ID */
  category: categoryIdSchema,
  /** Execution tier */
  tier: toolTierSchema,
  /** Search keywords */
  keywords: z.array(z.string()),
  /** Credit cost configuration */
  credits: creditConfigSchema.optional(),
});

/**
 * Schema for execution metadata.
 */
export const executionMetaSchema = z.object({
  executionTimeMs: z.number().min(0),
  inputSizeBytes: z.number().int().min(0),
  outputSizeBytes: z.number().int().min(0),
  creditsUsed: z.number().int().min(0),
  tier: toolTierSchema,
  timestamp: z.string().datetime(),
});

/**
 * Schema for tool error.
 */
export const toolErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  field: z.string().optional(),
  line: z.number().int().optional(),
  column: z.number().int().optional(),
});

// =============================================================================
// Request Schemas
// =============================================================================

/**
 * Request to execute a tool via API.
 * POST /api/tools/{toolId}/execute
 */
export const executeToolRequestSchema = z.object({
  /** Input data for the tool */
  input: z.unknown(),
  /** Optional tool configuration */
  options: z.record(z.string(), z.unknown()).optional(),
});

export type ExecuteToolRequest = z.infer<typeof executeToolRequestSchema>;

/**
 * Query parameters for listing tools.
 * GET /api/tools
 */
export const listToolsQuerySchema = z.object({
  /** Filter by category */
  category: categoryIdSchema.optional(),
  /** Search query */
  q: z.string().optional(),
  /** Filter by tier */
  tier: toolTierSchema.optional(),
  /** Page number (1-indexed) */
  page: z.coerce.number().int().min(1).default(1),
  /** Items per page */
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListToolsQuery = z.infer<typeof listToolsQuerySchema>;

/**
 * Path parameters for tool operations.
 */
export const toolPathParamsSchema = z.object({
  toolId: toolIdSchema,
});

export type ToolPathParams = z.infer<typeof toolPathParamsSchema>;

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Tool summary for listings.
 */
export const toolSummarySchema = z.object({
  id: toolIdSchema,
  name: z.string(),
  description: z.string(),
  category: categoryIdSchema,
  tier: toolTierSchema,
  keywords: z.array(z.string()),
});

export type ToolSummary = z.infer<typeof toolSummarySchema>;

/**
 * Paginated list response.
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
): z.ZodObject<{
  items: z.ZodArray<T>;
  total: z.ZodNumber;
  page: z.ZodNumber;
  limit: z.ZodNumber;
  hasMore: z.ZodBoolean;
}> =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    hasMore: z.boolean(),
  });

/**
 * List tools response.
 * GET /api/tools
 */
export const listToolsResponseSchema =
  paginatedResponseSchema(toolSummarySchema);

export type ListToolsResponse = z.infer<typeof listToolsResponseSchema>;

/**
 * Tool detail response.
 * GET /api/tools/{toolId}
 */
export const toolDetailSchema = z.object({
  id: toolIdSchema,
  name: z.string(),
  description: z.string(),
  category: categoryIdSchema,
  tier: toolTierSchema,
  keywords: z.array(z.string()),
  /** JSON Schema representation of input */
  inputSchema: z.record(z.string(), z.unknown()),
  /** JSON Schema representation of output */
  outputSchema: z.record(z.string(), z.unknown()),
  /** JSON Schema representation of options */
  optionsSchema: z.record(z.string(), z.unknown()).optional(),
  /** Credit cost information */
  credits: z
    .object({
      base: z.number(),
      perKb: z.number().optional(),
      threshold: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export type ToolDetail = z.infer<typeof toolDetailSchema>;

/**
 * Successful tool execution response.
 */
export const executeSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: executionMetaSchema,
});

export type ExecuteSuccessResponse = z.infer<
  typeof executeSuccessResponseSchema
>;

/**
 * Failed tool execution response.
 */
export const executeErrorResponseSchema = z.object({
  success: z.literal(false),
  error: toolErrorSchema,
  meta: executionMetaSchema,
});

export type ExecuteErrorResponse = z.infer<typeof executeErrorResponseSchema>;

/**
 * Tool execution response (union).
 * POST /api/tools/{toolId}/execute
 */
export const executeToolResponseSchema = z.discriminatedUnion("success", [
  executeSuccessResponseSchema,
  executeErrorResponseSchema,
]);

export type ExecuteToolResponse = z.infer<typeof executeToolResponseSchema>;

/**
 * Category with tool count.
 */
export const categoryWithCountSchema = z.object({
  id: categoryIdSchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  order: z.number().int(),
  slug: z.string(),
  toolCount: z.number().int().min(0),
});

export type CategoryWithCount = z.infer<typeof categoryWithCountSchema>;

/**
 * List categories response.
 * GET /api/categories
 */
export const listCategoriesResponseSchema = z.object({
  categories: z.array(categoryWithCountSchema),
});

export type ListCategoriesResponse = z.infer<
  typeof listCategoriesResponseSchema
>;

// =============================================================================
// Error Responses
// =============================================================================

/**
 * Standard API error response.
 */
export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * HTTP error codes.
 */
export const HTTP_ERRORS = {
  BAD_REQUEST: { status: 400, code: "BAD_REQUEST" },
  UNAUTHORIZED: { status: 401, code: "UNAUTHORIZED" },
  PAYMENT_REQUIRED: { status: 402, code: "PAYMENT_REQUIRED" },
  FORBIDDEN: { status: 403, code: "FORBIDDEN" },
  NOT_FOUND: { status: 404, code: "NOT_FOUND" },
  RATE_LIMITED: { status: 429, code: "RATE_LIMITED" },
  INTERNAL_ERROR: { status: 500, code: "INTERNAL_ERROR" },
} as const;

// =============================================================================
// API Route Definitions
// =============================================================================

/**
 * API route definitions for documentation.
 */
export const API_ROUTES = {
  /** List all tools with optional filters */
  LIST_TOOLS: {
    method: "GET" as const,
    path: "/api/tools",
    query: listToolsQuerySchema,
    response: listToolsResponseSchema,
  },
  /** Get tool details by ID */
  GET_TOOL: {
    method: "GET" as const,
    path: "/api/tools/:toolId",
    params: toolPathParamsSchema,
    response: toolDetailSchema,
  },
  /** Execute a tool */
  EXECUTE_TOOL: {
    method: "POST" as const,
    path: "/api/tools/:toolId/execute",
    params: toolPathParamsSchema,
    body: executeToolRequestSchema,
    response: executeToolResponseSchema,
  },
  /** List all categories */
  LIST_CATEGORIES: {
    method: "GET" as const,
    path: "/api/categories",
    response: listCategoriesResponseSchema,
  },
} as const;
