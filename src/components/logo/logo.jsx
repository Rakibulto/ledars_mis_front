'use client';

import { forwardRef } from 'react';

import Box from '@mui/material/Box';

import { RouterLink } from 'src/routes/components';

import { useGetCompanyInfo } from 'src/actions/settings';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export const Logo = forwardRef(
  (
    { width, href = '/', height, isSingle = true, disableLink = false, className, sx, ...other },
    ref
  ) => {
    const { companyInfo, companyInfoLoading } = useGetCompanyInfo();

    // const logoSrc =
    // companyInfoLoading && companyInfo?.logo
    //     ? companyInfo?.logo
    //     : `${CONFIG.assetsDir}/logo/logo.svg`;
    const logoSrc =
      !companyInfoLoading && companyInfo?.logo ? companyInfo?.logo : `/icons/logo.png`;

    const singleLogo = (
      <Box alt="Single logo" component="img" src={logoSrc} width="100%" height="100%" />
    );

    const fullLogo = (
      <Box alt="Full logo" component="img" src={logoSrc} width="100%" height="100%" />
    );

    const baseSize = {
      width: width ?? 72,
      height: height ?? 'auto',
      ...(!isSingle && {
        width: width ?? 102,
        height: height ?? 'auto',
      }),
    };

    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        onClick={() => sessionStorage.removeItem('lastVisitedPath')}
        className={logoClasses.root.concat(className ? ` ${className}` : '')}
        aria-label="Logo"
        sx={{
          ...baseSize,
          flexShrink: 0,
          display: 'inline-flex',
          verticalAlign: 'middle',
          ...(disableLink && { pointerEvents: 'none' }),
          ...sx,
        }}
        {...other}
      >
        {isSingle ? singleLogo : fullLogo}
      </Box>
    );
  }
);
