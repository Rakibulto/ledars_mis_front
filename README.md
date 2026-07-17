# Ledars MIS

A comprehensive Management Information System designed for Ledars operations. This system streamlines core HR and administrative processes including employee management, attendance tracking, leave management, notifications, and more with role-based access control.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Key Modules](#key-modules)
- [User Roles](#user-roles)
- [Configuration](#configuration)
- [Development](#development)
- [Documentation](#documentation)

## Overview

Ledars MIS provides a centralized platform for managing HR and operational activities. The system features role-based access control, seamless navigation, robust session management, and comprehensive error handling to ensure a smooth user experience.

## Features

- **Secure Authentication** - JWT-based authentication with role-based access
- **Employee Management** - Complete employee lifecycle from onboarding to offboarding
- **Attendance Tracking** - Biometric integration with ZKTeco F18 devices and web-based options
- **Leave Management** - Comprehensive leave policy administration with multi-level approval
- **Dashboard** - Customizable dashboards for different user roles
- **Permissions System** - Granular permission control for various system functions
- **Notification System** - Real-time notifications for requests and approvals

## Prerequisites

- Node.js 20.x (Recommended)
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Backend API server (see Configuration)

## Installation

### Using Yarn (Recommended)

```sh
yarn install
yarn dev
```

### Using npm

```sh
npm i
npm run dev
```

### Production Build

```sh
yarn build
# or
npm run build
```

## Key Modules

### Authentication & User Management

- JWT-based secure authentication
- Role-based access control (Admin, Supervisor, Employee)
- Password reset functionality
- Session management with proper invalidation

### Employee Management

- Comprehensive employee profiles
- Personal and official information management
- Document storage and management
- Employee directory with advanced search

### Attendance Management

- Integration with biometric devices
- Web-based attendance options with IP restrictions
- Attendance adjustment workflow with approvals
- Comprehensive attendance reports

### Leave Management

- Configurable leave types and policies
- Automated leave allocation based on employment type
- Multi-level approval workflow
- Leave balance tracking and reporting

### Admin Features

- System override capabilities
- Policy management interface
- After cut-off date modifications
- Advanced reporting and analytics

## User Roles

- **Employee**: Basic access to personal information, attendance, and leave requests
- **Supervisor**: Approves team members' requests and views team reports
- **Admin**: Full system access with override capabilities

## Configuration

### System Settings

Key configurable settings include:

- Cut-off dates for attendance/leave requests
- IP restrictions for web attendance
- Leave policy parameters
- Notification preferences

## Development

### Available Versions

- Next.js (current)

## Documentation

Comprehensive documentation is available covering:

- Permission System Documentation
- Project Progress Tracker

© Raktch Technology & Software
