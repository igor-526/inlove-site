const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const selector = process.env.NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY?.trim();

const errors = [];

if (!apiBaseUrl) {
  errors.push("NEXT_PUBLIC_API_BASE_URL is required");
} else {
  try {
    const parsed = new URL(apiBaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      errors.push("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL");
    }
  } catch {
    errors.push("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL");
  }
}

if (!selector) {
  errors.push("NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY is required");
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`Production configuration error: ${error}`);
  }
  process.exit(1);
}

console.log("Production public API configuration is valid (values hidden).");
