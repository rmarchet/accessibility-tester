# Accessibility Tester

A modern web application for testing website accessibility using axe-core, built with a React frontend and Node.js backend.

## Project Structure

This project uses a monorepo structure with Yarn workspaces:

```
accessibility-tester/
├── package.json              # Root package.json with workspace configuration
├── src/
│   ├── server/               # Backend API (Node.js + Express)
│   │   ├── package.json
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── __tests__/
│   └── frontend/             # Frontend app (React + Vite)
│       ├── package.json
│       ├── vite.config.js
│       ├── index.html
│       └── src/
│           ├── main.jsx
│           ├── App.jsx
│           ├── App.css
│           └── index.css
└── README.md
```

## Prerequisites

- Node.js >=20.0.0
- Yarn package manager

## Installation

Install all dependencies for both frontend and backend:

```bash
yarn install
```

## Development

### Start both frontend and backend in development mode:
```bash
yarn dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Start individual services:

**Backend only:**
```bash
yarn server:dev
```

**Frontend only:**
```bash
yarn frontend:dev
```

## Building for Production

### Build both frontend and backend:
```bash
yarn build
```

### Build individual services:

**Backend:**
```bash
yarn server:build
```

**Frontend:**
```bash
yarn frontend:build
```

## Testing

Run tests for all workspaces:
```bash
yarn test
```

Run tests in watch mode:
```bash
yarn test:watch
```

## API Endpoints

### POST /api/test
Test a website for accessibility issues.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "violations": [...],
  "passes": [...],
  "incomplete": [...],
  "inapplicable": [...]
}
```

## Architecture

### Frontend (React + Vite)
- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and development server
- **Axios**: HTTP client for API calls
- **Modern CSS**: Responsive design with dark/light mode support

### Backend (Node.js + Express)
- **Express**: Web framework
- **axe-core**: Accessibility testing engine
- **JSDOM**: DOM implementation for server-side testing
- **Canvas**: HTML5 Canvas API for headless rendering
- **CORS**: Cross-origin resource sharing

### Key Features
- **Monorepo**: Single repository with multiple packages
- **Workspace Management**: Yarn workspaces for dependency management
- **Development Proxy**: Frontend proxies API calls to backend during development
- **Modern Tooling**: Babel, ESLint, Vite, and Jest
- **Accessibility Testing**: Comprehensive accessibility analysis using axe-core

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.