# MatrixLab - Advanced Matrix Calculator & Scanner

MatrixLab is a modern, client-side, multi-matrix calculator and analysis tool. It features a robust mathematical engine for linear algebra operations, a dynamic multi-matrix workspace, and an optional serverless image scanner that extracts matrices directly from uploaded photographs.

## Features

- **Multi-Matrix Workspace**: Create, manage, and edit an unlimited number of matrices simultaneously.
- **Client-Side Calculations**: All linear algebra operations are deterministic and run securely in the browser. 
- **Advanced Operations**: Addition, multiplication, determinant, inverse, pseudo-inverse, trace, rank, nullity, RREF, LU/QR decomposition, eigenvalues/vectors, norms, and more.
- **Image Matrix Scanner (Optional)**: Capture or upload an image to automatically extract the mathematical matrix using Gemini.
- **Matrix History**: Your workspace and recent calculations are securely stored locally via `localStorage`.

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your API endpoint (no secret keys go in the frontend!):

```bash
cp .env.example .env
```

### 3. Start the Development Server

```bash
npm run dev
```

## Scanner Deployment (Netlify)

To enable the image matrix scanner, deploy the provided serverless function:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Link or create a project: `netlify link`
3. Set your Gemini API key in the Netlify environment variables: `netlify env:set GEMINI_API_KEY your_api_key_here`
4. Deploy the function: `netlify deploy --prod`

Update your frontend's `VITE_SCANNER_API_URL` to point to this deployed function.

## GitHub Pages Deployment

The static frontend is configured for deployment to GitHub Pages. The included `.github/workflows/deploy.yml` workflow automatically builds and deploys the `main` branch. 

MatrixLab's core operations work completely offline and require no backend. If the `VITE_SCANNER_API_URL` is omitted or offline, the calculator remains fully functional.
