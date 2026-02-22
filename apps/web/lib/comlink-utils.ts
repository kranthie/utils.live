/**
 * Comlink utility functions and types for type-safe proxy handling.
 *
 * Comlink uses a Symbol (releaseProxy) to mark proxy objects for cleanup.
 * This module provides type-safe utilities to work with this pattern.
 */

import * as Comlink from "comlink";

/**
 * Type representing a Comlink proxy with the releaseProxy symbol.
 * This allows type-safe access to the release function.
 */
export type ComlinkProxyWithRelease<T> = Comlink.Remote<T> & {
  [Comlink.releaseProxy]: () => void;
};

/**
 * Type guard to check if a value is a releasable Comlink proxy.
 */
function hasReleaseProxy(
  proxy: unknown
): proxy is { [key: symbol]: (() => void) | undefined } {
  return proxy !== null && typeof proxy === "object";
}

/**
 * Safely release a Comlink proxy.
 *
 * This function handles the Symbol-keyed releaseProxy method that Comlink
 * adds to wrapped proxies. It's a type-safe alternative to casting to `any`.
 *
 * @param proxy - The Comlink proxy to release (can be null/undefined)
 */
export function releaseComlinkProxy<T>(proxy: Comlink.Remote<T> | null): void {
  if (proxy && hasReleaseProxy(proxy)) {
    const release = proxy[Comlink.releaseProxy];
    if (typeof release === "function") {
      release();
    }
  }
}
