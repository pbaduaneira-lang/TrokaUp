import { Config } from '../constants/config';

export async function uploadImages({ images, userId }) {
  const baseUrl = Config.API_BASE_URL;
  console.log(`[TrokaUp] Iniciando upload de ${images.length} imagem(ns) para ${baseUrl}`);
  const uploadedUrls = [];

  for (let i = 0; i < images.length; i++) {
    try {
      const uri = images[i];
      const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      });

      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro no upload (${response.status})`);
      }

      const data = await response.json();
      const fullUrl = `${baseUrl}${data.url}`;
      uploadedUrls.push(fullUrl);
    } catch (err) {
      console.error(`Falha no upload da imagem ${i}:`, err);
      throw err;
    }
  }

  return uploadedUrls;
}
