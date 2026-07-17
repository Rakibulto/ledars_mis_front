'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { iconButtonClasses } from '@mui/material/IconButton';
import { useTheme, useColorScheme } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';

import { HandleSavePathnameToLocalStorage } from 'src/utils/storage-available';

import { useGetEmployee, useGetSupervisors } from 'src/actions/employees';

import { Logo } from 'src/components/logo';
import { useSettingsContext } from 'src/components/settings';
import { BaseOption } from 'src/components/settings/drawer/base-option';

import { AttendanceQuickAddEditForm } from 'src/sections/user/attendance-quick-add-edit-form';

import { useAuthContext } from 'src/auth/hooks';

import { Main } from './main';
import { NavMobile } from './nav-mobile';
import { layoutClasses } from '../classes';
import { NavVertical } from './nav-vertical';
import { _account } from '../config-nav-account';
import { NavHorizontal } from './nav-horizontal';
import { Searchbar } from '../components/searchbar';
import { useNavData } from '../config-nav-dashboard';
import { MenuButton } from '../components/menu-button';
import { LayoutSection } from '../core/layout-section';
import { HeaderSection } from '../core/header-section';
import { StyledDivider, useNavColorVars } from './styles';
import { AccountDrawer } from '../components/account-drawer';
import { ContactsPopover } from '../components/contacts-popover';
import { NotificationsDrawer } from '../components/notifications-drawer';

// ----------------------------------------------------------------------

export function DashboardLayout({ sx, children, header, data }) {
  const theme = useTheme();

  const mobileNavOpen = useBoolean();

  const settings = useSettingsContext();

  const navColorVars = useNavColorVars(theme, settings);

  const layoutQuery = 'lg';

  const { mode, setMode } = useColorScheme();

  // const { showModuleName, moduleHeader, setNavOpen } = useProjectContext();
  // const contextMenu = showModuleName;

  const navigationData = useNavData();

  // side navigation new feature logic building start--->>>
  // const menuItems = [];
  // navigationData.forEach((item) => {
  //   const menu = item.items;

  //   menu.forEach((subItem) => {
  //     if (subItem.title === contextMenu) {
  //       menuItems.push(subItem);
  //     }
  //   });
  // });
  // // console.log('menuItems:', menuItems);
  // const renderMenuItems = (subHeader) => {
  //   const navArry = [{ items: menuItems, subheader: subHeader }];
  //   return navArry;
  // };
  // const renderedMenuItems = renderMenuItems(moduleHeader);
  // useEffect(() => {
  //   if (renderedMenuItems?.[0]?.items?.[0]?.title) {
  //     setNavOpen(true);
  //   }
  // }, [renderedMenuItems, setNavOpen]);
  // side navigation new feature logic buinding end <<<---
  const { user } = useAuthContext();
  const isEmployeeOrSupervisor = user?.role === 'Employee' || user?.role === 'Supervisor';
  const { employee } = useGetEmployee(isEmployeeOrSupervisor && user?.id ? user.id : null);
  const isAdmin = user?.role === 'Admin';
  const { supervisors = [] } = useGetSupervisors();

  // Prepare contacts data for ContactsPopover
  const contactsData = isAdmin
    ? supervisors.map((sup) => ({
        id: sup.id,
        name: sup.username || sup.email,
        email: sup.email,
        avatarUrl: sup.profile_picture || '',
        status: 'online',
      }))
    : [];

  const isNavMini = settings.navLayout === 'mini';
  const isNavHorizontal = settings.navLayout === 'horizontal';
  const isNavVertical = isNavMini || settings.navLayout === 'vertical';

  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);

  useEffect(() => {
    if (
      user &&
      user.id &&
      isEmployeeOrSupervisor &&
      employee &&
      employee.allow_web_login &&
      !sessionStorage.getItem('attendanceDialogShown')
    ) {
      setShowAttendanceDialog(true);
      sessionStorage.setItem('attendanceDialogShown', 'true');
    }
  }, [user, employee, isEmployeeOrSupervisor]);

  const handleAttendanceDialogClose = () => {
    setShowAttendanceDialog(false);
  };

  return (
    <>
      <HandleSavePathnameToLocalStorage />
      {/* Attendance Dialog */}
      {showAttendanceDialog && (
        <AttendanceQuickAddEditForm
          open={showAttendanceDialog}
          onClose={handleAttendanceDialogClose}
          noDialog={false}
        />
      )}
      {/* <RemoveSavedPathname /> */}
      {/* Main Layout */}

      <LayoutSection
        /** **************************************
         * Header
         *************************************** */
        headerSection={
          <HeaderSection
            layoutQuery={layoutQuery}
            disableElevation={isNavVertical}
            slotProps={{
              toolbar: {
                sx: {
                  ...(isNavHorizontal && {
                    bgcolor: 'var(--layout-nav-bg)',
                    [`& .${iconButtonClasses.root}`]: {
                      color: 'var(--layout-nav-text-secondary-color)',
                    },
                    [theme.breakpoints.up(layoutQuery)]: {
                      height: 'var(--layout-nav-horizontal-height)',
                    },
                  }),
                },
              },
              container: {
                maxWidth: false,
                sx: {
                  ...(isNavVertical && { px: { [layoutQuery]: 5 } }),
                },
              },
            }}
            sx={header?.sx}
            slots={{
              topArea: (
                <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                  This is an info Alert.
                </Alert>
              ),
              bottomArea: isNavHorizontal ? (
                <NavHorizontal
                  data={navigationData}
                  layoutQuery={layoutQuery}
                  cssVars={navColorVars.section}
                />
              ) : null,
              leftArea: (
                <>
                  {/* -- Nav mobile -- */}
                  <MenuButton
                    onClick={mobileNavOpen.onTrue}
                    sx={{
                      mr: 1,
                      ml: -1,
                      [theme.breakpoints.up(layoutQuery)]: { display: 'none' },
                    }}
                  />
                  <NavMobile
                    data={navigationData}
                    open={mobileNavOpen.value}
                    onClose={mobileNavOpen.onFalse}
                    cssVars={navColorVars.section}
                  />
                  {/* -- Logo -- */}
                  {isNavHorizontal && (
                    <Logo
                      sx={{
                        display: 'none',
                        [theme.breakpoints.up(layoutQuery)]: {
                          display: 'inline-flex',
                        },
                      }}
                    />
                  )}
                  {/* -- Divider -- */}
                  {isNavHorizontal && (
                    <StyledDivider
                      sx={{
                        [theme.breakpoints.up(layoutQuery)]: { display: 'flex' },
                      }}
                    />
                  )}
                </>
              ),
              rightArea: (
                <Box display="flex" alignItems="center" gap={{ xs: 0, sm: 0.75 }}>
                  {/* -- Searchbar -- */}
                  <Searchbar data={navigationData} />
                  {/* -- Notifications popover -- */}
                  <NotificationsDrawer />
                  {/* -- Contacts popover -- */}
                  {user && user.role === 'Admin' && <ContactsPopover data={contactsData} />}
                  {/* -- Settings button -- */}
                  <BaseOption
                    selected={settings.colorScheme === 'dark'}
                    onClick={() => {
                      settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
                      setMode(mode === 'light' ? 'dark' : 'light');
                    }}
                  />
                  {/* -- Account drawer -- */}
                  <AccountDrawer data={_account} />
                </Box>
              ),
            }}
          />
        }
        /** **************************************
         * Sidebar
         *************************************** */

        // sidebarSection={
        //   isNavHorizontal ? null : (
        //     <NavVertical
        //       data={renderedMenuItems}
        //       isNavMini={isNavMini}
        //       layoutQuery={layoutQuery}
        //       cssVars={navColorVars.section}
        //       onToggleNav={() =>
        //         settings.onUpdateField(
        //           'navLayout',
        //           settings.navLayout === 'vertical' ? 'mini' : 'vertical'
        //         )
        //       }
        //     />
        //   )
        // }
        sidebarSection={
          isNavHorizontal ? null : (
            <NavVertical
              data={navigationData}
              isNavMini={isNavMini}
              layoutQuery={layoutQuery}
              cssVars={navColorVars.section}
              onToggleNav={() =>
                settings.onUpdateField(
                  'navLayout',
                  settings.navLayout === 'vertical' ? 'mini' : 'vertical'
                )
              }
            />
          )
        }
        /** **************************************
         * Footer
         *************************************** */
        footerSection={null}
        /** **************************************
         * Style
         *************************************** */
        cssVars={{
          ...navColorVars.layout,
          '--layout-transition-easing': 'linear',
          '--layout-transition-duration': '120ms',
          '--layout-nav-mini-width': '88px',
          '--layout-nav-vertical-width': '240px',
          '--layout-nav-horizontal-height': '64px',
          '--layout-dashboard-content-pt': theme.spacing(1),
          '--layout-dashboard-content-pb': theme.spacing(8),
          '--layout-dashboard-content-px': theme.spacing(5),
        }}
        sx={{
          [`& .${layoutClasses.hasSidebar}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
              pl: isNavMini ? 'var(--layout-nav-mini-width)' : 'var(--layout-nav-vertical-width)',
            },
          },
          ...sx,
        }}
      >
        <Main isNavHorizontal={isNavHorizontal}>{children}</Main>
      </LayoutSection>
    </>
  );
}
