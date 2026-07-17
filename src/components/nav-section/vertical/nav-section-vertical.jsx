import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Collapse from '@mui/material/Collapse';
import { useTheme } from '@mui/material/styles';

import { usePathname } from 'src/routes/hooks';
import { isPathActive } from 'src/routes/utils';

import { NavList } from './nav-list';
import { navSectionClasses } from '../classes';
import { navSectionCssVars } from '../css-vars';
import { NavUl, NavLi, Subheader } from '../styles';

// ----------------------------------------------------------------------

function getItemKey(item) {
  return item.path || item.title;
}

function getGroupKey(group) {
  return group.subheader ?? group?.items?.[0]?.title;
}

function hasActiveItem(items, pathname) {
  return items.some((item) => {
    if (isPathActive(pathname, item.path, !!item.children, item.activeMatch)) {
      return true;
    }

    return item.children ? hasActiveItem(item.children, pathname) : false;
  });
}

function findActiveRootItemKey(items, pathname) {
  const activeItem = items.find((item) => item.children && hasActiveItem([item], pathname));
  return activeItem ? getItemKey(activeItem) : null;
}

export function NavSectionVertical({
  sx,
  data,
  render,
  slotProps,
  enabledRootRedirect,
  cssVars: overridesVars,
}) {
  const theme = useTheme();
  const pathname = usePathname();

  const cssVars = {
    ...navSectionCssVars.vertical(theme),
    ...overridesVars,
  };

  const [openGroup, setOpenGroup] = useState(() => {
    const activeGroup = data.find((group) => hasActiveItem(group.items, pathname));
    return activeGroup ? getGroupKey(activeGroup) : getGroupKey(data[0]);
  });

  useEffect(() => {
    const activeGroup = data.find((group) => hasActiveItem(group.items, pathname));

    if (activeGroup) {
      setOpenGroup(getGroupKey(activeGroup));
    }
  }, [data, pathname]);

  const handleToggleGroup = useCallback((groupKey) => {
    setOpenGroup((prev) => (prev === groupKey ? null : groupKey));
  }, []);

  return (
    <Stack component="nav" className={navSectionClasses.vertical.root} sx={{ ...cssVars, ...sx }}>
      <NavUl sx={{ flex: '1 1 auto', gap: 'var(--nav-item-gap)' }}>
        {data.map((group, index) => (
          <Group
            key={`${getGroupKey(group)}-${index}`}
            subheader={group.subheader}
            items={group.items}
            render={render}
            slotProps={slotProps}
            enabledRootRedirect={enabledRootRedirect}
            open={!group.subheader || openGroup === getGroupKey(group)}
            onToggle={() => handleToggleGroup(getGroupKey(group))}
          />
        ))}
      </NavUl>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function Group({ items, render, subheader, slotProps, enabledRootRedirect, open, onToggle }) {
  const pathname = usePathname();

  const [openItem, setOpenItem] = useState(() => findActiveRootItemKey(items, pathname));

  useEffect(() => {
    setOpenItem(findActiveRootItemKey(items, pathname));
  }, [items, pathname]);

  const handleToggleItem = useCallback((itemKey) => {
    setOpenItem((prev) => (prev === itemKey ? null : itemKey));
  }, []);

  const renderContent = (
    <NavUl sx={{ gap: 'var(--nav-item-gap)' }}>
      {items.map((list, index) => (
        <NavList
          key={`${getItemKey(list)}-${index}`}
          data={list}
          render={render}
          depth={1}
          slotProps={slotProps}
          enabledRootRedirect={enabledRootRedirect}
          openMenu={openItem === getItemKey(list)}
          onToggleMenu={handleToggleItem}
        />
      ))}
    </NavUl>
  );

  return (
    <NavLi>
      {subheader ? (
        <>
          <Subheader
            data-title={subheader}
            open={open}
            onClick={onToggle}
            sx={slotProps?.subheader}
          >
            {subheader}
          </Subheader>

          <Collapse in={open}>{renderContent}</Collapse>
        </>
      ) : (
        renderContent
      )}
    </NavLi>
  );
}
