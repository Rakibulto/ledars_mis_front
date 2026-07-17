'use client';

import NextLink from 'next/link';
import { useRouter, useParams as useNextParams } from 'next/navigation';

function normalizeHref(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value.startsWith('/') ? `/dashboard/procurement${value}` : value;
}

export function Link({ to, href, ...props }) {
  return <NextLink href={normalizeHref(to ?? href)} {...props} />;
}

export function useNavigate() {
  const router = useRouter();

  return (target, options = {}) => {
    const resolvedHref = normalizeHref(target);

    if (options.replace) {
      router.replace(resolvedHref);
      return;
    }

    router.push(resolvedHref);
  };
}

export function useParams() {
  const params = useNextParams();

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
}

const ReactRouter = {
  Link,
  useNavigate,
  useParams,
};

export default ReactRouter;
