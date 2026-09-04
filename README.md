# MatrixLab - Advanced Matrix Calculator & Scanner

MatrixLab is a modern, client-side, multi-matrix calculator and linear algebra analysis tool. It features a high-precision mathematical engine for advanced matrix computations, a dynamic multi-matrix workspace, and an optional client-side image scanner that extracts matrices directly from camera photos or uploaded images using Gemini.

## Features

- **Multi-Matrix Workspace**: Create, manage, rename, duplicate, and edit an unlimited number of matrices simultaneously (A, B, C, D, ...).
- **Client-Side Calculations**: All linear algebra operations are deterministic, fast, and run 100% locally in the browser with zero backend requirements.
- **Comprehensive Operations**: Addition, multiplication, determinant, inverse, pseudo-inverse, trace, rank, nullity, REF, RREF, LU/QR decomposition, eigenvalues/eigenvectors, norms, linear system solving, and more.
- **Direct Gemini Image Scanner**: Capture or upload photos to recognize and extract matrices into your workspace with confidence scoring and interactive pre-acceptance editing.
- **Local Persistence**: Workspace state and recent calculation history are securely preserved in browser `localStorage`.

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Local Environment (Optional)

To enable the image matrix scanner during local development, create a `.env.local` file in the project root:


```

*(Note: `.env.local` is ignored by git and will not be committed.)*

### 3. Start Development Server

```bash
npm run dev
```

## GitHub Pages Deployment

MatrixLab is built for static deployment directly to GitHub Pages:

1. In your GitHub repository, navigate to **Settings** → **Secrets and variables** → **Actions**.
2. Add a new repository secret:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your Gemini API key
3. Ensure GitHub Pages is enabled under **Settings** → **Pages** (Source: **GitHub Actions**).
4. Pushing to `main` or running the **Deploy to GitHub Pages** workflow will automatically build and publish MatrixLab to GitHub Pages.

MatrixLab's mathematical calculator runs entirely offline and functions seamlessly even if the scanner key is not configured.
