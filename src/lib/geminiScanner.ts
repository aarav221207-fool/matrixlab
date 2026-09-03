/**
 * Direct browser client for Gemini matrix scanning.
 * Configured via import.meta.env.VITE_GEMINI_API_KEY (provided at build time via GitHub Secrets or .env.local).
 */

export interface MatrixScanResult {
  success: boolean;
  rows?: number;
  columns?: number;
  matrix?: number[][];
  confidence?: number;
  notes?: string;
  error?: string;
}

/**
 * Validates and scales down camera photos on a client-side canvas
 * to optimize payload size and latency while preserving numeral clarity.
 */
export async function prepareImageForGemini(file: File, maxDimension = 1600): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        return reject(new Error('Unable to read image dimensions.'));
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context could not be created.'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      const commaIdx = dataUrl.indexOf(',');
      const base64Data = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;

      resolve({ base64Data, mimeType });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image file.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Returns the active Gemini API key configured from the environment.
 */
export function getActiveGeminiKey(): string | null {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return null;
}

/**
 * Validates the raw JSON output from Gemini to ensure strict rectangular numerical matrices.
 */
export function validateMatrixStructure(parsed: any): MatrixScanResult {
  const { rows, columns, matrix, confidence, notes } = parsed || {};

  // Client-side numerical matrix validation
  if (
    typeof rows !== 'number' ||
    typeof columns !== 'number' ||
    rows <= 0 ||
    columns <= 0 ||
    !Array.isArray(matrix) ||
    matrix.length !== rows ||
    !matrix.every((r: any) =>
      Array.isArray(r) &&
      r.length === columns &&
      r.every((v: any) => typeof v === 'number' && Number.isFinite(v) && !isNaN(v))
    )
  ) {
    return {
      success: false,
      error: 'Could not extract a valid rectangular numerical matrix from this image. Please try a clearer picture.',
    };
  }

  return {
    success: true,
    rows,
    columns,
    matrix,
    confidence: typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : 0.9,
    notes: notes || '',
  };
}

/**
 * Calls Gemini API directly from the browser to extract rectangular numerical matrices.
 */
export async function scanMatrixWithGemini(file: File, keyOverride?: string): Promise<MatrixScanResult> {
  const apiKey = keyOverride !== undefined ? keyOverride : getActiveGeminiKey();

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      error: 'Gemini scanner is not configured.',
    };
  }

  let imageData: { base64Data: string; mimeType: string };
  try {
    imageData = await prepareImageForGemini(file);
  } catch (prepErr: any) {
    return {
      success: false,
      error: prepErr?.message || 'Failed to process image before scanning.',
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.base64Data,
            },
          },
          {
            text: 'Extract the numerical matrix visible in this photo. Support negative signs, integers, fractions, and decimals. If values are written as fractions (e.g. 1/2 or -3/4), compute their decimal equivalent. Return strictly rectangular numerical rows and columns in the requested JSON schema.',
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          rows: { type: 'INTEGER', description: 'Number of rows in the matrix' },
          columns: { type: 'INTEGER', description: 'Number of columns in the matrix' },
          matrix: {
            type: 'ARRAY',
            description: '2D array of numeric values',
            items: {
              type: 'ARRAY',
              items: { type: 'NUMBER' },
            },
          },
          confidence: { type: 'NUMBER', description: 'Confidence score between 0.0 and 1.0' },
          notes: { type: 'STRING', description: 'Any warnings or notation notes' },
        },
        required: ['rows', 'columns', 'matrix', 'confidence'],
      },
    },
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr: any) {
    return {
      success: false,
      error: 'Network connection to Gemini failed. Check your internet connection.',
    };
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || '';
    } catch {
      // ignore json parse error
    }

    if (response.status === 400 || response.status === 403) {
      return {
        success: false,
        error: errorDetail ? `Gemini API error: ${errorDetail}` : 'Invalid Gemini API key or request configuration.',
      };
    }
    if (response.status === 429) {
      return {
        success: false,
        error: 'Gemini API rate limit reached. Please wait a few moments before retrying.',
      };
    }
    return {
      success: false,
      error: errorDetail ? `Gemini API error (${response.status}): ${errorDetail}` : `Gemini service error (${response.status}). Please retry.`,
    };
  }

  let resultJson: any;
  try {
    resultJson = await response.json();
  } catch {
    return {
      success: false,
      error: 'Received unparseable response from Gemini service.',
    };
  }

  const rawCandidateText = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawCandidateText) {
    return {
      success: false,
      error: 'Gemini did not return any candidate text for this image.',
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawCandidateText);
  } catch {
    return {
      success: false,
      error: 'Gemini output could not be parsed as matrix JSON.',
    };
  }

  return validateMatrixStructure(parsed);
}
