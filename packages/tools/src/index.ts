/**
 * @utils-live/tools
 *
 * Core tool engine for utils.live platform.
 * Provides type-safe tool definitions, validation, and execution.
 *
 * @packageDocumentation
 */

// Types
export * from "./types";

// Core utilities
export * from "./core";

// Categories
export * from "./categories";

// API utilities
export * from "./api";

// Tools
export * from "./tools";

// Auto-register all tools on import
export { registerAllTools, getToolCount } from "./tools/register";
import "./tools/register";
