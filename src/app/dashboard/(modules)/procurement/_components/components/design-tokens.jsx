// Design System Tokens - Reference Documentation
// This file serves as documentation for the design system
export const designTokens = {
  // Color System
  colors: {
    primary: '#1e40af', // Deep Blue
    success: '#16a34a', // Green
    warning: '#ea580c', // Orange
    danger: '#dc2626', // Red
    info: '#0ea5e9', // Sky Blue
    // Neutrals
    background: '#f8f9fa', // Light Gray
    card: '#ffffff', // White
    border: '#e5e7eb', // Gray-200
    muted: '#6b7280', // Gray-500
    foreground: '#1a1a1a', // Almost Black
  },
  // Spacing System (8px base)
  spacing: {
    0: '0px',
    1: '8px', // 0.5rem
    2: '16px', // 1rem
    3: '24px', // 1.5rem
    4: '32px', // 2rem
    5: '40px', // 2.5rem
    6: '48px', // 3rem
    8: '64px', // 4rem
    10: '80px', // 5rem
    12: '96px', // 6rem
  },
  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  // Typography
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1440px', // Desktop-first design
  },
};
export const componentGuidelines = {
  buttons: {
    minHeight: '40px',
    padding: {
      sm: '6px 12px',
      md: '8px 16px',
      lg: '12px 24px',
    },
    borderRadius: '8px',
    fontSize: {
      sm: '14px',
      md: '14px',
      lg: '16px',
    },
  },
  forms: {
    inputHeight: '40px',
    inputPadding: '8px 12px',
    labelMarginBottom: '8px',
    fieldGap: '24px',
    borderRadius: '8px',
  },
  cards: {
    padding: {
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
    borderRadius: '8px',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  tables: {
    headerBg: '#f3f4f6',
    rowHeight: '48px',
    cellPadding: '12px 24px',
    borderColor: '#e5e7eb',
  },
  sidebar: {
    width: '256px',
    itemHeight: '40px',
    itemPadding: '10px 12px',
    iconSize: '20px',
  },
  topbar: {
    height: '64px',
    padding: '0 24px',
  },
};
// Usage example documentation
export const usageExamples = {
  button: `
import { Button } from './components/ui/button';

<Button variant="primary">Save</Button>
<Button variant="outline" icon={Download}>Export</Button>
  `,
  input: `
import { Input } from './components/ui/input';

<Input 
  label="Full Name"
  placeholder="Enter name"
  required
  helperText="As per official documents"
/>
  `,
  table: `
import { Table, DataTable } from './components/ui/table';

<DataTable
  title="Requisitions"
  actions={<Button>Add New</Button>}
>
  <Table 
    columns={columns}
    data={data}
    onRowClick={(row) => console.log(row)}
  />
</DataTable>
  `,
};
