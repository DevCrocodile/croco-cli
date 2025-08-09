#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

// Template files content
const templates = {
  // Root package.json
  rootPackageJson: (projectName) => `{
  "name": "${projectName}",
  "private": true,
  "scripts": {
    "co": "sui-mono commit",
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "dev": "turbo run dev --parallel"
  },
  "devDependencies": {
    "@s-ui/mono": "2.45.0",
    "ts-standard": "12.0.2",
    "turbo": "2.5.5"
  }
}`,

  // Root tsconfig.json
  rootTsConfig: () => `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["apps/**/*", "packages/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  // Frontend package.json
  frontendPackageJson: () => `{
  "name": "frontend",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/react": "^4.3.0",
    "@tailwindcss/vite": "^4.1.11",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "astro": "^5.12.3",
    "clsx": "2.1.1",
    "lucide-react": "0.526.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "tailwind-merge": "3.3.1",
    "tailwindcss": "^4.1.11"
  }
}`,

  // Astro config
  astroConfig: () => `import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwind()]
  }
});`,

  // Frontend utility function (cn for tailwind classes)
  cnUtility: () => `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,

  // Backend package.json
  backendPackageJson: () => `{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "cors": "2.8.5",
    "express": "5.1.0",
    "morgan": "1.10.0"
  },
  "devDependencies": {
    "@types/cors": "2.8.19",
    "@types/express": "5.0.3",
    "@types/morgan": "1.9.10",
    "dotenv": "16.5.0",
    "tsx": "4.20.3",
    "typescript": "5.8.3"
  }
}`,

  // Backend tsconfig.json
  backendTsConfig: () => `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  // Express server
  expressServer: () => `import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Routes
app.use('/api', router);

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,

  // Error classes
  errors: () => `export class ApiError extends Error {
  statusCode: number

  constructor (message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
  }
}

export class NotFoundError extends ApiError {
  constructor (message = 'Not Found') {
    super(message, 404)
  }
}

export class ValidationError extends ApiError {
  constructor (message = 'Validation Error') {
    super(message, 400)
  }
}

export class UnauthorizedError extends ApiError {
  constructor (message = 'Unauthorized') {
    super(message, 401)
  }
}

export class InternalServerError extends ApiError {
  constructor (message = 'Internal server error') {
    super(message, 500)
  }
}`,

  // Error handler middleware
  errorHandler: () => `import { ApiError } from '../errors.js';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal Server Error' });
};`,

  // Routes index
  routesIndex: () => `import { Router } from 'express';
import { exampleController } from '../controllers/exampleController.js';

export const router = Router();

router.get('/health', exampleController.health);
router.get('/example', exampleController.getExample);`,

  // Example controller
  exampleController: () => `import { Request, Response, NextFunction } from 'express';
import { NotFoundError, ValidationError, InternalServerError } from '../errors.js';

export const exampleController = {
  health: (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Server is running' });
  },

  getExample: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Example logic here
      const data = { message: 'Hello from backend!' };
      res.json({ success: true, data });
    } catch (error) {
      next(new InternalServerError('Something went wrong'));
    }
  }
};`,

  // Example model
  exampleModel: () => `// Example model structure
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}`,

  // Types package.json
  typesPackageJson: () => `{
  "name": "types",
  "version": "1.0.0",
  "type": "module",
  "main": "index.ts",
  "dependencies": {
    "zod": "^3.22.4"
  }
}`,

  // Types index
  typesIndex: () => `import { z } from 'zod';

// Common schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional()
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};`,

  // .env file
  envFile: () => `PORT=3000
DATABASE_URL=your_database_url_here`,

  // .gitignore
  gitignore: () => `# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`,

  // Turbo config
  turboConfig: () => `{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}`
};

async function createProject() {
  console.log('🐊 Welcome to Croco - Your Full-Stack Project Generator!');
  console.log('');

  const projectName = await question('📁 Enter your project name: ');
  const installDeps = await question('📦 Do you want to install dependencies? (y/n): ');

  const shouldInstall = installDeps.toLowerCase() === 'y' || installDeps.toLowerCase() === 'yes';

  console.log('');
  console.log('🚀 Creating your project...');

  // Create project directory
  const projectPath = path.join(process.cwd(), projectName);
  createDirectory(projectPath);

  // Create folder structure
  createDirectory(path.join(projectPath, 'apps'));
  createDirectory(path.join(projectPath, 'apps/frontend'));
  createDirectory(path.join(projectPath, 'apps/frontend/src'));
  createDirectory(path.join(projectPath, 'apps/frontend/src/utils'));
  createDirectory(path.join(projectPath, 'apps/backend'));
  createDirectory(path.join(projectPath, 'apps/backend/src'));
  createDirectory(path.join(projectPath, 'apps/backend/src/controllers'));
  createDirectory(path.join(projectPath, 'apps/backend/src/models'));
  createDirectory(path.join(projectPath, 'apps/backend/src/routes'));
  createDirectory(path.join(projectPath, 'apps/backend/src/middleware'));
  createDirectory(path.join(projectPath, 'packages'));
  createDirectory(path.join(projectPath, 'packages/types'));

  // Create files
  console.log('📝 Creating configuration files...');
  
  // Root files
  writeFile(path.join(projectPath, 'package.json'), templates.rootPackageJson(projectName));
  writeFile(path.join(projectPath, 'tsconfig.json'), templates.rootTsConfig());
  writeFile(path.join(projectPath, '.env'), templates.envFile());
  writeFile(path.join(projectPath, '.gitignore'), templates.gitignore());
  writeFile(path.join(projectPath, 'turbo.json'), templates.turboConfig());

  // Frontend files
  writeFile(path.join(projectPath, 'apps/frontend/package.json'), templates.frontendPackageJson());
  writeFile(path.join(projectPath, 'apps/frontend/astro.config.mjs'), templates.astroConfig());
  writeFile(path.join(projectPath, 'apps/frontend/src/utils/cn.ts'), templates.cnUtility());

  // Backend files
  writeFile(path.join(projectPath, 'apps/backend/package.json'), templates.backendPackageJson());
  writeFile(path.join(projectPath, 'apps/backend/tsconfig.json'), templates.backendTsConfig());
  writeFile(path.join(projectPath, 'apps/backend/src/index.ts'), templates.expressServer());
  writeFile(path.join(projectPath, 'apps/backend/src/errors.ts'), templates.errors());
  writeFile(path.join(projectPath, 'apps/backend/src/middleware/errorHandler.ts'), templates.errorHandler());
  writeFile(path.join(projectPath, 'apps/backend/src/routes/index.ts'), templates.routesIndex());
  writeFile(path.join(projectPath, 'apps/backend/src/controllers/exampleController.ts'), templates.exampleController());
  writeFile(path.join(projectPath, 'apps/backend/src/models/example.ts'), templates.exampleModel());

  // Types package
  writeFile(path.join(projectPath, 'packages/types/package.json'), templates.typesPackageJson());
  writeFile(path.join(projectPath, 'packages/types/index.ts'), templates.typesIndex());

  console.log('🔧 Setting up git repository...');
  process.chdir(projectPath);
  execSync('git init', { stdio: 'inherit' });

  if (shouldInstall) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  console.log('');
  console.log('🎉 Project created successfully!');
  console.log('');
  console.log('📂 Project structure:');
  console.log(`${projectName}/`);
  console.log('├── apps/');
  console.log('│   ├── frontend/    (Astro + React + Tailwind)');
  console.log('│   └── backend/     (Express + TypeScript)');
  console.log('├── packages/');
  console.log('│   └── types/       (Shared types with Zod)');
  console.log('├── package.json');
  console.log('├── tsconfig.json');
  console.log('├── turbo.json');
  console.log('└── .env');
  console.log('');
  console.log('🚀 Next steps:');
  console.log(`   cd ${projectName}`);
  if (!shouldInstall) {
    console.log('   npm install');
  }
  console.log('   npm run dev');
  console.log('');
  console.log('🐊 Happy coding with Croco!');

  rl.close();
}

createProject().catch(console.error);