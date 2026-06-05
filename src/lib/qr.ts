import QRCode from "qrcode";

/** Returns a PNG data URL suitable for embedding in Satori flyer templates. */
export async function generateQrDataUrl(url: string, size = 320) {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: {
      dark: "#0A1A2F",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/** Returns PNG bytes for embedding in pdf-lib documents. */
export async function generateQrPngBytes(url: string, size = 320) {
  const dataUrl = await generateQrDataUrl(url, size);
  const base64 = dataUrl.split(",")[1];
  return new Uint8Array(Buffer.from(base64, "base64"));
}
