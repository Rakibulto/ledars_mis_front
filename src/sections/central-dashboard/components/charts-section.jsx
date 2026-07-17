'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import {
  Pie,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  PieChart,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { SectionCard } from './common';

export const CHART_COLORS = [
  '#00a76f',
  '#2065D1',
  '#FF9F40',
  '#FF5630',
  '#9966FF',
  '#36A2EB',
  '#FFCE56',
  '#EA5545',
  '#4BC0C0',
  '#FF6384',
];

const CHART_HEIGHT = 280;

function ChartSkeleton({ title }) {
  return (
    <SectionCard title={title}>
      <Skeleton variant="rounded" height={CHART_HEIGHT} />
    </SectionCard>
  );
}

function ChartEmpty({ message = 'No data available' }) {
  return (
    <Box
      sx={{ height: CHART_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

function ProcurementStatusChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ProjectProgressChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RevenueExpenseChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill="#00a76f" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#FF5630" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BeneficiaryDistributionChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmployeeDistributionChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LeadStatusChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function InventoryMovementChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="inbound" fill="#00a76f" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outbound" fill="#FF9F40" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TaskCompletionChart({ data }) {
  if (!data || !data.length) return <ChartEmpty />;
  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const CHART_DEFS = [
  {
    key: 'procurement_status',
    title: 'Procurement Status',
    description: 'Distribution of procurement requests',
    Component: ProcurementStatusChart,
  },
  {
    key: 'project_progress',
    title: 'Project Progress',
    description: 'Projects by status',
    Component: ProjectProgressChart,
  },
  {
    key: 'revenue_vs_expense',
    title: 'Revenue vs Expense',
    description: 'Monthly comparison',
    Component: RevenueExpenseChart,
  },
  {
    key: 'beneficiary_distribution',
    title: 'Beneficiary Distribution',
    description: 'By demographic category',
    Component: BeneficiaryDistributionChart,
  },
  {
    key: 'employee_distribution',
    title: 'Employee Distribution',
    description: 'By department',
    Component: EmployeeDistributionChart,
  },
  {
    key: 'lead_status',
    title: 'Lead Status',
    description: 'CRM lead pipeline',
    Component: LeadStatusChart,
  },
  {
    key: 'inventory_movement',
    title: 'Inventory Movement',
    description: 'Inbound vs outbound',
    Component: InventoryMovementChart,
  },
  {
    key: 'task_completion',
    title: 'Task Completion',
    description: 'Task status overview',
    Component: TaskCompletionChart,
  },
];

export default function ChartsSection({ charts, isLoading }) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Analytics
      </Typography>
      <Grid container spacing={3}>
        {CHART_DEFS.map(({ key, title, description, Component }) =>
          isLoading ? (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <ChartSkeleton title={title} />
            </Grid>
          ) : (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <SectionCard title={title} description={description}>
                <Component data={charts?.[key]} />
              </SectionCard>
            </Grid>
          )
        )}
      </Grid>
    </Box>
  );
}
