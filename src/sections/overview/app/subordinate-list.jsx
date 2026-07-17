import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';

import { getRandomBgColor } from 'src/utils/random-color';

import { Iconify } from 'src/components/iconify';

export function SubordinateList({
  supervisorInfo,
  title = 'Subordinate List',
  subheader,
  ...other
}) {
  const preparedList = (supervisorInfo?.subordinate_list ?? []).map((sub) => ({
    id: sub.employee_id,
    name: sub.employee_name,
    avatarUrl: sub.profile_picture || '',
  }));

  const [expanded, setExpanded] = useState(false);
  const showToggle = preparedList.length > 10;
  const displayList = showToggle && !expanded ? preparedList.slice(0, 10) : preparedList;

  return (
    <Card {...other}>
      <CardHeader
        title={`${title} (${supervisorInfo?.total_subordinates ?? 0})`}
        subheader={subheader}
      />
      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {displayList.map((item, index) => (
          <SubordinateItem key={item.id} item={item} index={index} />
        ))}
        {showToggle && (
          <Button
            variant="text"
            color="primary"
            size="small"
            sx={{ width: 'fit-content' }}
            onClick={() => setExpanded((v) => !v)}
            startIcon={
              expanded ? (
                <Iconify icon="eva:arrow-ios-upward-fill" width={18} />
              ) : (
                <Iconify icon="eva:arrow-ios-downward-fill" width={18} />
              )
            }
          >
            {expanded ? 'Show Less' : `Show All (${preparedList.length})`}
          </Button>
        )}
      </Box>
    </Card>
  );
}

function SubordinateItem({ item, index, sx, ...other }) {
  return (
    <Box
      sx={{
        gap: 2,
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
      {...other}
    >
      <Avatar
        alt={item.name}
        src={item.avatarUrl}
        variant="rounded"
        sx={{ width: 40, height: 40, bgcolor: getRandomBgColor() }}
      />
      <Box flexGrow={1}>
        <Box sx={{ typography: 'subtitle2' }}>{item.name}</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mt: 0.5 }}>{item.id}</Box>
      </Box>
    </Box>
  );
}
