# 🐊 Croco CLI

**Croco CLI** is a friendly and fast command-line tool to bootstrap **full-stack monorepo projects** using **Astro, React, TailwindCSS, Express, and TypeScript**.  
Start coding in seconds with a clean, opinionated setup for modern web apps.

---
## ✨ Features
- 🚀 **Full-stack monorepo** ready-to-use.
- ⚡ **Astro + React + TailwindCSS** for the frontend.
- 🛠 **Express** for the backend.
- 📦 **TypeScript** for both frontend & backend.
- 🐊 A cute croco-themed starter landing page.
- 🔄 Shared types between client and server.

---

## 📦 Installation

You can run Croco CLI without installing it globally:

```bash
npx croco-cli
```

Or install it globally:

```bash
npm install croco-cli
```

## 🔧 Usage

```bash
croco
```

The CLI will guide you through

1. Project name.
2. Install or not dependencies.

Once done:

```bash
cd my-project
npm run dev
```

## 📁 Project structure

```perl
my-project/
├── apps/
│   ├── frontend/          # Astro + React + Tailwind app
│   └── backend/          # Express + TypeScript backend
├── packages/
│   └── types/        # Shared TypeScript types
└── package.json
```

## 🎨 The Starter Landing Page
When you run the CLI, your new Astro project comes with a Croco-themed landing page:

* Built with Astro + TailwindCSS

* Includes a React component (CrocBites.tsx) mounted with client:load

* Easy to customize or replace

## 📝 License
This project is licensed under the MIT License – see the LICENSE file for details.

