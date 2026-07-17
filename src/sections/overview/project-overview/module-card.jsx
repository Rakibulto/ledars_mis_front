'use client';

import { m } from 'framer-motion';

import Typography from '@mui/material/Typography';
import { Box, Card, alpha, Stack, CardContent } from '@mui/material';

import { varHover } from 'src/components/animate';

// ----------------------------------------------------------------------

export function ModuleCard({ module, isSelected, onSelect }) {
  return (
    <Card
      component={m.div}
      whileHover="hover"
      variants={varHover(1.02)}
      onClick={() => onSelect(module?.title, module?.header)}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        minHeight: 200,
        cursor: 'pointer',
        borderRadius: 2.5,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        border: (theme) =>
          `1px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.12)}`,
        boxShadow: (theme) => (isSelected ? theme.customShadows.primary : theme.customShadows.card),
        background: (theme) => alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: (theme) => theme.customShadows.z20,
          borderColor: 'primary.main',
          '& .module-icon-wrapper': {
            backgroundColor: (theme) => theme.palette.primary.main,
            transform: 'scale(1.05) rotate(5deg)',
          },
          '& .module-icon': {
            color: 'common.white',
            transform: 'scale(1.1)',
          },
          '& .module-hover-line': {
            width: '100%',
            opacity: 1,
          },
          '& .module-description': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      {/* Background Gradient Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 150,
          height: 150,
          opacity: 0.04,
          transform: 'translate(30%, -30%)',
          transition: 'all 0.4s ease',
        }}
      >
        {module?.icon}
      </Box>

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: (theme) =>
            `linear-gradient(to top, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />

      <CardContent
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Stack spacing={2} sx={{ flex: 1 }}>
          {/* Icon */}
          <Box
            className="module-icon-wrapper"
            sx={{
              width: 72,
              height: 72,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 2.5,
                padding: '1px',
                background: (theme) =>
                  `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, transparent 100%)`,
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0.6,
              },
            }}
          >
            <Box
              className="module-icon"
              sx={{
                fontSize: 36,
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '& svg': {
                  width: 36,
                  height: 36,
                },
              }}
            >
              {module?.icon}
            </Box>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            {/* Title */}
            <Typography
              variant="h6"
              sx={{
                mb: 1,
                fontWeight: 700,
                color: 'text.primary',
                lineHeight: 1.3,
                fontSize: { xs: '1rem', sm: '1.1rem' },
              }}
            >
              {module?.title}
            </Typography>

            {/* Animated Line */}
            <Box
              className="module-hover-line"
              sx={{
                width: 40,
                height: 3,
                borderRadius: 1.5,
                background: (theme) =>
                  `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                mb: 1.5,
                opacity: 0.6,
              }}
            />

            {/* Description */}
            <Typography
              className="module-description"
              variant="body2"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.6,
                opacity: 0,
                transform: 'translateY(-8px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {module?.description || 'Click to access this module'}
            </Typography>
          </Box>
        </Stack>

        {/* Category Badge */}
        {module?.category && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              zIndex: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {module.category}
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Selection Indicator */}
      {isSelected && (
        <Box
          component={m.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            boxShadow: (theme) => theme.customShadows.primary,
          }}
        >
          <Box
            component="svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            sx={{ color: 'common.white' }}
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor" />
          </Box>
        </Box>
      )}
    </Card>
  );
}
