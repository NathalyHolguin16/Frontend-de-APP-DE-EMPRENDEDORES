import { Platform } from "react-native";

const maxStoreImageBytes = 5 * 1024 * 1024;

export function validateStoreImage(asset) {
  if (!asset?.uri) return "Selecciona una imagen válida.";
  if (asset.fileSize && asset.fileSize > maxStoreImageBytes) {
    return "La imagen debe pesar máximo 5 MB.";
  }
  if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
    return "Selecciona un archivo de imagen.";
  }
  return "";
}

export function createStoreFormData(fields, images, methodOverride = false) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value === null ? "" : String(value));
    }
  });
  if (methodOverride) formData.append("_method", "PUT");

  appendImage(formData, "logo", images?.logo);
  appendImage(formData, "banner", images?.banner);

  return formData;
}

function appendImage(formData, field, asset) {
  if (!asset?.uri) return;
  if (Platform.OS === "web" && asset.file) {
    formData.append(field, asset.file);
    return;
  }
  formData.append(field, {
    uri: asset.uri,
    name: asset.fileName || `${field}-${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
  });
}
