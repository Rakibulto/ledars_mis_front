'use client';

import { mutate } from 'swr';
import { m } from 'framer-motion';
import { useRef, useMemo, useState, useReducer, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetNotifications, markAllNotificationsAsRead } from 'src/actions/notification';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

const getTabCounts = (totalCount, unreadCount) => ({
  all: totalCount,
  unread: unreadCount,
});

function useForceUpdate() {
  const [, dispatch] = useReducer((x) => x + 1, 0);
  return dispatch;
}

// ----------------------------------------------------------------------

export function NotificationsDrawer({ sx, ...other }) {
  const drawer = useBoolean();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTab, setCurrentTab] = useState('all');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const PAGE_SIZE = 30;

  // Build filters for the hook
  const filters = useMemo(
    () => ({
      status: currentTab === 'unread' ? 'unread' : currentTab === 'read' ? 'read' : null,
      type: typeFilter !== 'all' ? typeFilter : null,
    }),
    [currentTab, typeFilter]
  );

  // Fetch notifications from backend with pagination and filters
  const {
    notification: userNotifications = [],
    notificationLoading,
    notificationCount,
    notificationUnreadCount,
    notificationPage,
  } = useGetNotifications(currentPage, PAGE_SIZE, filters);

  // Transform backend notifications to UI format
  const notifications = useMemo(
    () =>
      userNotifications?.map((n) => ({
        id: n?.id,
        type: n?.type || '',
        title: n?.title || '',
        createdAt: n?.created_at,
        isUnRead: n?.status === 'Unread',
        status: n?.status,
        remarks: n?.remarks || '',
        avatarUrl: null,
        notification_id: n?.notification_id || null,
        employee: n?.employee || {},
      })),
    [userNotifications]
  );

  // Calculate total pages
  const totalPages = Math.ceil(notificationCount / PAGE_SIZE);

  // Dynamic tab counts
  const tabCounts = getTabCounts(notificationCount, notificationUnreadCount);
  const TABS = [
    { value: 'all', label: 'All', count: tabCounts.all },
    { value: 'unread', label: 'Unread', count: tabCounts.unread },
  ];

  // Type filter options based on backend supported types
  const TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'leave', label: 'Leave' },
    { value: 'attendance_adjustment', label: 'Attendance Adjustment' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'probation_period', label: 'Probation Period' },
  ];

  // Open/close filter menu handlers
  const handleFilterMenuOpen = (event) => setFilterAnchorEl(event.currentTarget);
  const handleFilterMenuClose = () => setFilterAnchorEl(null);

  // Handle type filter change
  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
    handleFilterMenuClose();
  };

  // Handle pagination change
  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const submittingRef = useRef(false);
  const forceUpdate = useForceUpdate();

  const handleMarkAllAsRead = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    forceUpdate();
    try {
      await markAllNotificationsAsRead();
      toast.success('All notifications marked as read');
      mutate(
        (key) => typeof key === 'string' && key.startsWith(endpoints.notification.list),
        (currentData) => {
          if (currentData) {
            return { ...currentData, unread_count: 0 };
          }
          return currentData;
        }
      );
    } catch (error) {
      console.error('Failed to mark notifications as read', error?.detail || error);
      toast.error('Failed to mark notifications as read');
    } finally {
      submittingRef.current = false;
      forceUpdate();
    }
  };

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
    setCurrentPage(1); // Reset to first page on tab change
  }, []);

  // Get total unread count
  const totalUnRead = notificationUnreadCount;

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Mark all as read">
          <span>
            <IconButton
              color="primary"
              onClick={handleMarkAllAsRead}
              disabled={notificationLoading || submittingRef.current}
            >
              {submittingRef.current ? (
                <Iconify icon="line-md:loading-twotone-loop" />
              ) : (
                <Iconify icon="eva:done-all-fill" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}

      <IconButton onClick={drawer.onFalse}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, pt: 1 }}>
        <CustomTabs
          variant="fullWidth"
          value={currentTab}
          onChange={handleChangeTab}
          sx={{
            flex: 1,
            borderRadius: 2,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              iconPosition="end"
              value={tab.value}
              label={tab.label}
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'
                  }
                  color={tab.value === 'unread' ? 'error' : 'default'}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </CustomTabs>
        <Tooltip title="Filter by type">
          <IconButton
            color={typeFilter !== 'all' ? 'primary' : 'default'}
            onClick={handleFilterMenuOpen}
          >
            <Iconify icon="eva:funnel-fill" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {TYPE_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={typeFilter === option.value}
              onClick={() => handleTypeFilterChange(option.value)}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </Stack>
      {typeFilter !== 'all' && (
        <Stack direction="row" spacing={1} sx={{ px: 2, pt: 1 }}>
          <Chip
            label={TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label}
            onDelete={() => {
              setTypeFilter('all');
              setCurrentPage(1);
            }}
            color="primary"
            size="small"
          />
        </Stack>
      )}
    </>
  );

  const renderList = (
    <Scrollbar>
      {notificationLoading ? (
        <Box component="ul">
          {[...Array(6)].map((_, idx) => (
            <Box
              component="li"
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                p: 2.5,
                borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width="80%" height={18} />
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box component="ul">
          {notifications.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem notification={notification} />
            </Box>
          ))}
          {notifications.length === 0 && (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
              No notifications found
            </Box>
          )}
        </Box>
      )}
    </Scrollbar>
  );

  const renderPagination = (
    <Stack
      alignItems="center"
      sx={{ py: 1, px: 2, borderTop: '1px solid', borderColor: 'divider', borderStyle: 'dashed' }}
    >
      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          size="small"
          color="primary"
          disabled={notificationLoading}
        />
      )}
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
        {notificationCount > 0
          ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(
              currentPage * PAGE_SIZE,
              notificationCount
            )} of ${notificationCount}`
          : 'No notifications'}
      </Typography>
    </Stack>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <SvgIcon>
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}

        {renderTabs}

        {renderList}

        {renderPagination}
      </Drawer>
    </>
  );
}
