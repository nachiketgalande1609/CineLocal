# CinéLocal

A local movie streaming app with a Netflix-style UI. Stream your personal video library from any browser on your network.

## Quick Start

### 1. Get a free TMDB API key

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Settings → API** and request a free API key (choose "Developer")
3. Copy your **API Key (v3 auth)**

### 2. Set up your environment

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# Edit .env and replace your_tmdb_api_key_here with your actual key
```

Or set it inline when running (see step 4).

### 3. Install dependencies

```bash
# Install root (server) dependencies
npm install

# Install frontend dependencies
npm install --prefix client
```

### 4. Run the app

**Development mode** (hot-reload for both server and client):

```bash
# With .env file:
npm run dev

# Or inline on Windows:
set TMDB_API_KEY=your_key && npm run dev

# Or inline on Mac/Linux:
TMDB_API_KEY=your_key npm run dev
```

**Production mode** (build frontend, serve everything from one port):

```bash
npm run build        # build React frontend
npm start            # serve on http://localhost:3001
```

Open **http://localhost:5173** (dev) or **http://localhost:3001** (prod).

### 5. Add your movie folders

1. Click **Settings** (gear icon in top right)
2. Enter the full path to a folder containing your video files
3. Click **Add Folder** — CinéLocal will scan it immediately and start fetching metadata in the background

---

## Supported Formats

`mp4` `mkv` `avi` `mov` `wmv` `m4v` `webm`

## Features

- **Hero banner** — random featured movie with backdrop, description, and play button
- **Genre rows** — movies grouped by genre in horizontal scrollable rows
- **Hover cards** — expand on hover with backdrop, rating, year, and genres
- **Full-screen player** — native HTML5 `<video>` with range request support (seeking works)
- **TMDB enrichment** — automatic poster, backdrop, description, cast, and genre data
- **Metadata cache** — saved to `.cinelocal/metadata.json`, no re-fetching on restart
- **File watcher** — new video files in configured folders are picked up automatically
- **Search** — search across titles, descriptions, and filenames
- **Settings page** — add or remove folders at any time

## Project Structure

```
CinéLocal/
├── .cinelocal/          # auto-created: config.json + metadata.json
├── server/
│   ├── index.js         # Express server entry point
│   ├── routes/
│   │   ├── movies.js    # GET /api/movies, GET /api/movies/:id
│   │   ├── stream.js    # GET /api/stream/:id (range request streaming)
│   │   └── folders.js   # GET/POST/DELETE /api/folders
│   └── services/
│       ├── scanner.js   # file scanner + chokidar watcher
│       ├── tmdb.js      # TMDB API enrichment
│       └── cache.js     # JSON-file cache for metadata + config
├── client/              # Vite + React frontend
│   └── src/
│       ├── App.jsx
│       ├── components/  # Navbar, HeroBanner, MovieRow, MovieCard, SearchBar
│       └── pages/       # HomePage, PlayerPage, SettingsPage
├── .env.example
└── package.json
```

## Keyboard Shortcuts (Player)

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `→` | Skip forward 10s |
| `←` | Skip back 10s |
| `Esc` | Exit player |
