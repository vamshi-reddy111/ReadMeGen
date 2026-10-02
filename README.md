# README Auto Generator

A web application that analyzes public GitHub repositories and generates concise README files in Markdown using Gemini.

## Features

- Analyze GitHub repository metadata, languages, project structure, dependencies, technologies, and scripts.
- Generate a README with a live Markdown preview.
- Copy or download the generated `README.md` file.

## Technologies

- React
- Vite
- Express
- Axios
- Google Gemini API
- React Markdown

## Project Structure

```text
backend/   Express API server
frontend/  Vite and React application
```

## Requirements

- Node.js
- A Gemini API key
- A public GitHub repository URL

## Setup

Install dependencies in both packages:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token
```

`GITHUB_TOKEN` is optional and can provide higher GitHub API rate limits for public repositories.

## Development

Start the backend:

```bash
cd backend
npm run dev
```

The API runs at `http://localhost:5000`.

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

The Vite development server runs at the URL shown in the terminal, normally `http://localhost:5173`.

To use a different API base URL, set `VITE_API_URL` in the frontend environment.

## Available API Endpoints

- `GET /api/health` checks whether the backend is running.
- `POST /api/analyze` analyzes a GitHub repository URL.
- `POST /api/generate` generates README Markdown from repository analysis data.
- `POST /api/download` downloads README Markdown as `README.md`.

## Production Build

Build the frontend with:

```bash
cd frontend
npm run build
```

Preview the production build with:

```bash
npm run preview
```
