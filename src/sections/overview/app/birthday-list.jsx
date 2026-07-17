import dayjs from 'dayjs';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CardHeader from '@mui/material/CardHeader';

import { getRandomBgColor } from 'src/utils/random-color';

import { Iconify } from 'src/components/iconify';

export function BirthdayList({ title = 'Birthday List', subheader, employees = [], ...other }) {
  const [showAll, setShowAll] = useState(false);

  const preparedList = employees.map((emp) => ({
    id: emp.employee_id,
    name: emp.employee_name,
    avatarUrl: emp.profile_picture || '',
    department: emp.department__name,
    designation: emp.designation__name,
    dob: emp.date_of_birth,
  }));

  const displayList =
    preparedList.length > 10 && !showAll ? preparedList.slice(0, 10) : preparedList;

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      <Box
        sx={{
          p: 3,
          gap: 3,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {displayList.map((item, index) => (
          <BirthdayItem key={`${item.id}-${index}`} item={item} index={index} />
        ))}
        {preparedList.length > 10 && (
          <Button
            variant="text"
            size="small"
            color="primary"
            sx={{ width: 'fit-content' }}
            onClick={() => setShowAll((prev) => !prev)}
            startIcon={
              showAll ? (
                <Iconify icon="eva:arrow-ios-upward-fill" width={18} />
              ) : (
                <Iconify icon="eva:arrow-ios-downward-fill" width={18} />
              )
            }
          >
            {showAll ? 'Show Less' : `Show All (${preparedList.length})`}
          </Button>
        )}
      </Box>
    </Card>
  );
}

function BirthdayItem({ item, index, sx, ...other }) {
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
        sx={{ width: 40, height: 40 }}
      />
      <Box flexGrow={1}>
        <Box sx={{ typography: 'subtitle2' }}>{item.name}</Box>
        <Box sx={{ typography: 'caption', color: 'text.secondary', mt: 0.5 }}>
          {item.department && (
            <span>
              {item.department}
              {item.designation ? ` • ${item.designation}` : ''}
            </span>
          )}
        </Box>
        <Box sx={{ typography: 'caption', color: getRandomBgColor(), mt: 0.5 }}>
          {dayjs(item.dob).format('DD MMM YYYY')}
        </Box>
      </Box>
    </Box>
  );
}
