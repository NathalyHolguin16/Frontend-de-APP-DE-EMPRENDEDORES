import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

const maxStoreCoverBytes = 5 * 1024 * 1024;

export function validateStoreCover(asset) {
  if (!asset?.uri) return "Selecciona una imagen válida.";
  if (asset.fileSize && asset.fileSize > maxStoreCoverBytes) {
    return "La imagen debe pesar máximo 5 MB.";
  }
  if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
    return "Selecciona un archivo de imagen.";
  }
  return "";
}

export function createStoreFormData(fields, asset, methodOverride = false) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value === null ? "" : String(value));
    }
  });
  if (methodOverride) formData.append("_method", "PUT");

  if (Platform.OS === "web" && asset.file) {
    formData.append("cover", asset.file);
  } else {
    formData.append("cover", {
      uri: asset.uri,
      name: asset.fileName || `portada-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  }

  return formData;
}

export async function persistStoreCover(asset, storeId) {
  const fallbackUri = asset.previewUri || asset.uri;
  if (Platform.OS === "web") {
    return {
      uri: fallbackUri,
      fileName: asset.fileName || "portada.jpg",
      mimeType: asset.mimeType || "image/jpeg",
    };
  }

  try {
    const directory = new Directory(Paths.document, "mercatto-store-covers");
    if (!directory.exists) directory.create({ idempotent: true });

    const extension = getExtension(asset);
    const destination = new File(
      directory,
      `${String(storeId || "store")}-${Date.now()}.${extension}`,
    );
    const source = new File(asset.uri);
    source.copy(destination);

    return {
      uri: destination.uri,
      fileName: destination.name,
      mimeType: asset.mimeType || `image/${extension}`,
    };
  } catch {
    return {
      uri: fallbackUri,
      fileName: asset.fileName || "portada.jpg",
      mimeType: asset.mimeType || "image/jpeg",
    };
  }
}

function getExtension(asset) {
  const fileNameExtension = String(asset.fileName || "")
    .split(".")
    .pop()
    .toLowerCase();
  if (["jpg", "jpeg", "png", "webp"].includes(fileNameExtension)) {
    return fileNameExtension === "jpeg" ? "jpg" : fileNameExtension;
  }
  if (asset.mimeType === "image/png") return "png";
  if (asset.mimeType === "image/webp") return "webp";
  return "jpg";
}
