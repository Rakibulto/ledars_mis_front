import { Box, Stack, TableRow, Skeleton, TableCell } from '@mui/material';

export default function TableRowSkeleton({ columns = [], ...other }) {
  return (
    <TableRow {...other}>
      {columns.map((col, index) => (
        <TableCell key={index} align={col.align ?? 'left'}>
          {col.type === 'text' && (
            <Box>
              {Array.from({ length: col.lines ?? 1 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="text"
                  width={col.width ?? '80%'}
                  height={col.height ?? 18}
                  sx={{ mb: i !== (col.lines ?? 1) - 1 ? 0.5 : 0 }}
                />
              ))}
            </Box>
          )}

          {col.type === 'rect' && (
            <Skeleton
              variant="rectangular"
              width={col.width ?? 80}
              height={col.height ?? 24}
              sx={{ borderRadius: 1.5 }}
            />
          )}

          {col.type === 'circle' && (
            <Stack direction="row" spacing={0.5} justifyContent="center">
              {Array.from({ length: col.count ?? 1 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="circular"
                  width={col.size ?? 32}
                  height={col.size ?? 32}
                />
              ))}
            </Stack>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}
