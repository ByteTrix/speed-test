# Environment Configuration Guide

This document explains how to configure the speed test application using environment variables.

## Configuration File

Create a `.env.local` file in the root directory of the project (it's already gitignored).

## Available Environment Variables

### `NEXT_PUBLIC_TEST_MODE`

Controls whether the application runs real speed tests or uses dummy/simulated data.

- **Values**: `real` | `dummy`
- **Default**: `real`
- **Description**:
  - `real`: Performs actual speed tests using M-Lab's NDT7 protocol
  - `dummy`: Uses simulated data for UI development and testing

**Example:**
```bash
NEXT_PUBLIC_TEST_MODE=dummy
```

---

### `NEXT_PUBLIC_AUTO_START`

Controls whether the speed test starts automatically when the page loads.

- **Values**: `true` | `false`
- **Default**: `false`
- **Description**:
  - `true`: Automatically starts the speed test on page load
  - `false`: User must manually click "Start Test" button

**Example:**
```bash
NEXT_PUBLIC_AUTO_START=true
```

---

### Dummy Mode Configuration

These variables are only used when `NEXT_PUBLIC_TEST_MODE=dummy`:

#### `NEXT_PUBLIC_DUMMY_DOWNLOAD_SPEED`

- **Type**: Number (Mbps)
- **Default**: `150.5`
- **Description**: Simulated download speed in Mbps

#### `NEXT_PUBLIC_DUMMY_UPLOAD_SPEED`

- **Type**: Number (Mbps)
- **Default**: `75.2`
- **Description**: Simulated upload speed in Mbps

#### `NEXT_PUBLIC_DUMMY_PING`

- **Type**: Number (milliseconds)
- **Default**: `25`
- **Description**: Simulated ping/latency in milliseconds

**Example:**
```bash
NEXT_PUBLIC_DUMMY_DOWNLOAD_SPEED=200.0
NEXT_PUBLIC_DUMMY_UPLOAD_SPEED=100.0
NEXT_PUBLIC_DUMMY_PING=15
```

---

## Example Configurations

### Development Mode (Dummy Data)

Use this for UI development without making actual network requests:

```bash
NEXT_PUBLIC_TEST_MODE=dummy
NEXT_PUBLIC_AUTO_START=true
NEXT_PUBLIC_DUMMY_DOWNLOAD_SPEED=150.5
NEXT_PUBLIC_DUMMY_UPLOAD_SPEED=75.2
NEXT_PUBLIC_DUMMY_PING=25
```

### Production Mode (Real Tests)

Use this for production deployment with manual test start:

```bash
NEXT_PUBLIC_TEST_MODE=real
NEXT_PUBLIC_AUTO_START=false
```

### Demo Mode (Auto-start Real Tests)

Use this for demonstrations where you want tests to start automatically:

```bash
NEXT_PUBLIC_TEST_MODE=real
NEXT_PUBLIC_AUTO_START=true
```

---

## Setup Instructions

1. Copy the example file to create your local configuration:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your preferred settings

3. Restart the development server for changes to take effect:
   ```bash
   bun dev
   # or
   npm run dev
   ```

---

## Notes

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Changes to `.env.local` require a server restart to take effect
- The `.env.local` file is gitignored and should not be committed to version control
- In dummy mode, a yellow banner appears at the top indicating "Development Mode"
- Dummy tests simulate realistic speed variations and take about 16 seconds to complete
