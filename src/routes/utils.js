// ----------------------------------------------------------------------

export const hasParams = (url) => {
  const queryString = url.split('?')[1];
  return queryString ? new URLSearchParams(queryString).toString().length > 0 : false;
};

// ----------------------------------------------------------------------

export function removeLastSlash(pathname) {
  /**
   * Remove last slash
   * [1]
   * @input  = '/dashboard/calendar/'
   * @output = '/dashboard/calendar'
   * [2]
   * @input  = '/dashboard/calendar'
   * @output = '/dashboard/calendar'
   */
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

// ----------------------------------------------------------------------

export function removeParams(url) {
  try {
    const urlObj = new URL(url, window.location.origin);

    return removeLastSlash(urlObj.pathname);
  } catch (error) {
    return url;
  }
}

// ----------------------------------------------------------------------

export function isExternalLink(url) {
  return typeof url === 'string' && url.startsWith('http');
}

// ----------------------------------------------------------------------

function matchesPathRule(currentPath, matchRule, defaultDeep = false) {
  if (!matchRule) return false;

  if (matchRule instanceof RegExp) {
    return matchRule.test(currentPath);
  }

  if (typeof matchRule === 'object' && matchRule.pattern) {
    const pattern =
      matchRule.pattern instanceof RegExp ? matchRule.pattern : new RegExp(matchRule.pattern);
    return pattern.test(currentPath);
  }

  const path = typeof matchRule === 'object' ? matchRule.path : matchRule;
  const deep =
    typeof matchRule === 'object' && typeof matchRule.deep === 'boolean'
      ? matchRule.deep
      : defaultDeep;

  if (!path || path.startsWith('#') || isExternalLink(path)) {
    return false;
  }

  const pathHasParams = hasParams(path);
  const normalizedItemPath = removeLastSlash(pathHasParams ? removeParams(path) : path);

  if (pathHasParams || !deep) {
    return currentPath === normalizedItemPath;
  }

  return currentPath === normalizedItemPath || currentPath.startsWith(`${normalizedItemPath}/`);
}

// ----------------------------------------------------------------------

export function isPathActive(pathname, itemPath, deep = false, matchPaths = []) {
  if (!itemPath || itemPath.startsWith('#') || isExternalLink(itemPath)) {
    return Array.isArray(matchPaths)
      ? matchPaths.some((rule) => matchesPathRule(removeLastSlash(pathname), rule, deep))
      : matchesPathRule(removeLastSlash(pathname), matchPaths, deep);
  }

  const currentPath = removeLastSlash(pathname);
  if (matchesPathRule(currentPath, itemPath, deep)) {
    return true;
  }

  if (Array.isArray(matchPaths)) {
    return matchPaths.some((rule) => matchesPathRule(currentPath, rule, deep));
  }

  return matchesPathRule(currentPath, matchPaths, deep);
}
