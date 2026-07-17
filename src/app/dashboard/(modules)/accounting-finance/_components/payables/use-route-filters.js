'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function normalizeFilterValue(value, definition) {
  if (value === undefined || value === null || value === '') {
    return definition.defaultValue;
  }

  if (definition.allowedValues && !definition.allowedValues.includes(value)) {
    return definition.defaultValue;
  }

  return value;
}

export function useRouteFilters(definitions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const definitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.key, definition])),
    [definitions]
  );

  const filters = useMemo(
    () =>
      definitions.reduce((result, definition) => {
        result[definition.key] = normalizeFilterValue(searchParams.get(definition.key), definition);
        return result;
      }, {}),
    [definitions, searchParams]
  );

  const buildHref = useCallback(
    (href, overrides = {}) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(overrides).forEach(([key, value]) => {
        const definition = definitionMap.get(key);
        if (!definition) return;

        const normalized = normalizeFilterValue(value, definition);
        if (normalized === definition.defaultValue || normalized === '') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, normalized);
        }
      });

      const query = nextParams.toString();
      return query ? `${href}?${query}` : href;
    },
    [definitionMap, searchParams]
  );

  const updateFilter = useCallback(
    (key, value, options = {}) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const definition = definitionMap.get(key);
      if (!definition) return;

      const normalized = normalizeFilterValue(value, definition);
      if (normalized === definition.defaultValue || normalized === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, normalized);
      }

      (options.resetKeys || []).forEach((resetKey) => {
        const resetDefinition = definitionMap.get(resetKey);
        if (!resetDefinition) return;
        nextParams.delete(resetKey);
      });

      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [definitionMap, pathname, router, searchParams]
  );

  return {
    filters,
    buildHref,
    updateFilter,
  };
}
