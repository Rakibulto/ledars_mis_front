import { useState, useEffect, useCallback } from 'react';

import { usePathname } from 'src/routes/hooks';
import { isPathActive, isExternalLink } from 'src/routes/utils';
import { useActiveLink } from 'src/routes/hooks/use-active-link';

import { NavItem } from './nav-item';
import { navSectionClasses } from '../classes';
import { NavUl, NavLi, NavCollapse } from '../styles';

// ----------------------------------------------------------------------

function getItemKey(item) {
  return `${item.title || ''}::${item.path || ''}`;
}

function hasActiveItem(item, pathname) {
  if (item.forceActive) {
    return true;
  }

  if (isPathActive(pathname, item.path, !!item.children, item.activeMatch)) {
    return true;
  }

  return item.children ? item.children.some((child) => hasActiveItem(child, pathname)) : false;
}

function findActiveItemKey(items, pathname) {
  const activeItem = items.find((item) => item.children && hasActiveItem(item, pathname));
  return activeItem ? getItemKey(activeItem) : null;
}

export function NavList({
  data,
  render,
  depth,
  slotProps,
  enabledRootRedirect,
  openMenu,
  onToggleMenu,
}) {
  const active = useActiveLink(data.path, !!data.children, data.activeMatch) || !!data.forceActive;

  const handleToggleMenu = useCallback(() => {
    if (data.children) {
      onToggleMenu?.(getItemKey(data));
    }
  }, [data, onToggleMenu]);

  const renderNavItem = (
    <NavItem
      render={render}
      // slots
      path={data.path}
      icon={data.icon}
      info={data.info}
      title={data.title}
      caption={data.caption}
      // state
      depth={depth}
      active={active}
      disabled={data.disabled}
      hasChild={!!data.children}
      open={data.children && openMenu}
      externalLink={isExternalLink(data.path)}
      enabledRootRedirect={enabledRootRedirect}
      // styles
      slotProps={depth === 1 ? slotProps?.rootItem : slotProps?.subItem}
      // actions
      onClick={handleToggleMenu}
    />
  );

  // Hidden item by role
  if (data.roles && slotProps?.currentRole) {
    if (!data?.roles?.includes(slotProps?.currentRole)) {
      return null;
    }
  }

  // Has children
  if (data.children) {
    return (
      <NavLi
        disabled={data.disabled}
        sx={{
          [`& .${navSectionClasses.li}`]: {
            '&:first-of-type': { mt: 'var(--nav-item-gap)' },
          },
        }}
      >
        {renderNavItem}

        <NavCollapse data-group={data.title} in={openMenu} depth={depth} unmountOnExit mountOnEnter>
          <NavSubList
            data={data.children}
            render={render}
            depth={depth}
            slotProps={slotProps}
            enabledRootRedirect={enabledRootRedirect}
          />
        </NavCollapse>
      </NavLi>
    );
  }

  // Default
  return <NavLi disabled={data.disabled}>{renderNavItem}</NavLi>;
}

// ----------------------------------------------------------------------

function NavSubList({ data, render, depth, slotProps, enabledRootRedirect }) {
  const pathname = usePathname();

  const [openItem, setOpenItem] = useState(() => findActiveItemKey(data, pathname));

  useEffect(() => {
    setOpenItem(findActiveItemKey(data, pathname));
  }, [data, pathname]);

  const handleToggleItem = useCallback((itemKey) => {
    setOpenItem((prev) => (prev === itemKey ? null : itemKey));
  }, []);

  return (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {data.map((list) => (
        <NavList
          key={getItemKey(list)}
          data={list}
          render={render}
          depth={depth + 1}
          slotProps={slotProps}
          enabledRootRedirect={enabledRootRedirect}
          openMenu={openItem === getItemKey(list)}
          onToggleMenu={handleToggleItem}
        />
      ))}
    </NavUl>
  );
}
