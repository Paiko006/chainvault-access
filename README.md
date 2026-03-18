# ChainVault Access

ChainVault Access is a decentralized data vault built on the Aptos ecosystem using the Shelby Protocol. It provides secure, wallet-based file storage with client-side encryption.

## Features

- **Decentralized Storage**: Leveraging the Shelby Protocol for resilient data hosting.
- **Client-Side Encryption**: AES-GCM encryption performed locally; keys never leave your device.
- **Aptos Integration**: Secure authentication and transaction signing via Aptos wallets.
- **Privacy First**: Only authorized wallet addresses can decrypt and access your files.
- **Premium UI**: Modern dark-mode interface with interactive 3D elements.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Petra Wallet](https://petra.app/) or any Aptos-compatible wallet.

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd chainvault-access
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your Shelby API key:
   ```env
   VITE_SHELBY_API_KEY=your_actual_api_key_here
   ```

4. Run the development server:
   ```sh
   npm run dev
   ```

## Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Blockchain**: Aptos TS SDK, Shelby Protocol SDK
- **Encryption**: Web Crypto API (AES-GCM)

## Security Protections

The application includes several layers of protection:
- **Anti-Copy**: Right-click, text selection, and image dragging are disabled.
- **Anti-Inspect**: Developer tool shortcuts (F12, Ctrl+Shift+I) are blocked.
- **DevTools Detector**: Active scanning for open developer tools with automatic console clearing.

---
© 2026 ChainVault Access. All rights reserved.
