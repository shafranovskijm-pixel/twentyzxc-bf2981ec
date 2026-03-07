// Pre-load signature and stamp from Cloud storage as base64 data URIs
const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/document-assets`;

let signatureDataUri: string | null = null;
let stampDataUri: string | null = null;

async function toDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function getSignatureDataUri(): Promise<string> {
  if (!signatureDataUri) {
    signatureDataUri = await toDataUri(`${STORAGE_BASE}/signature.png`);
  }
  return signatureDataUri;
}

export async function getStampDataUri(): Promise<string> {
  if (!stampDataUri) {
    stampDataUri = await toDataUri(`${STORAGE_BASE}/stamp.png`);
  }
  return stampDataUri;
}

export async function preloadDocumentImages(): Promise<{ signature: string; stamp: string }> {
  const [signature, stamp] = await Promise.all([
    getSignatureDataUri(),
    getStampDataUri(),
  ]);
  return { signature, stamp };
}
