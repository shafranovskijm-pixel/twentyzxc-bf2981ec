// Pre-load signature and stamp as base64 data URIs for embedding in documents
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
    signatureDataUri = await toDataUri('/images/signature.png');
  }
  return signatureDataUri;
}

export async function getStampDataUri(): Promise<string> {
  if (!stampDataUri) {
    stampDataUri = await toDataUri('/images/stamp.png');
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
