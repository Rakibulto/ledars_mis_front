import { usePathname } from './use-pathname';
import { useSearchParams } from './use-search-params';
import { hasParams, isPathActive, removeLastSlash } from '../utils';

// ----------------------------------------------------------------------

export function useActiveLink(itemPath, deep = true, matchPaths = []) {
  const pathname = removeLastSlash(usePathname());
  const searchParams = useSearchParams();

  if (!itemPath && (!Array.isArray(matchPaths) || !matchPaths.length)) {
    return false;
  }

  /**
   * [1] Apply for Item has children or has params.
   */
  const pathHasParams = !!itemPath && hasParams(itemPath);

  if (pathHasParams) {
    const [pathWithoutParams, pathQueryString = ''] = itemPath.split('?');
    const normalizedItemPath = removeLastSlash(pathWithoutParams);

    if (pathname !== normalizedItemPath) {
      return false;
    }

    const requiredParams = new URLSearchParams(pathQueryString);

    for (const [key, value] of requiredParams.entries()) {
      if ((searchParams.get(key) || '') !== value) {
        return false;
      }
    }

    return true;
  }

  const isDeep = deep || pathHasParams;

  return isPathActive(pathname, itemPath, isDeep, matchPaths);
}
