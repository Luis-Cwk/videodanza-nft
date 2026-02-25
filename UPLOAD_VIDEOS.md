# 🎬 VideoDanza: Cómo Subir 25 Videos a IPFS/Pinata

## Paso 1: Obtener API Keys de Pinata

1. Ve a https://pinata.cloud
2. Crea una cuenta (o inicia sesión si ya tienes)
3. Ve a **Settings** → **API Keys** → **+ New Key**
4. Dale permisos: ✓ pinFileToIPFS
5. Copia:
   - **API Key** (JWT o API Key)
   - **API Secret** (Secret Key)

## Paso 2: Actualizar el script Python

Edita `upload_to_pinata.py` y reemplaza:

```python
PINATA_API_KEY = "tu_api_key_aqui"
PINATA_SECRET_KEY = "tu_secret_key_aqui"
```

## Paso 3: Ejecutar el Upload

### Option A: Python (recomendado)
```bash
cd C:/Users/petra/videodanza-nft
pip install requests  # si no lo tienes
python upload_to_pinata.py
```

Esto:
- Sube los 25 videos a Pinata IPFS
- Genera `ipfs_lookup_table.json` automáticamente
- Muestra el progreso de cada video

### Option B: Manual (si prefieres controlar más)

Para cada video:
```bash
curl -X POST "https://api.pinata.cloud/pinning/pinFileToIPFS" \
  -H "pinata_api_key: YOUR_KEY" \
  -H "pinata_secret_api_key: YOUR_SECRET" \
  -F "file=@C:/Users/petra/videodanza-nft/videos/SB (1).mp4"
```

## Paso 4: Verificar ipfs_lookup_table.json

Después del upload, verifica que el archivo fue creado:
```bash
cat C:/Users/petra/videodanza-nft/frontend/public/ipfs_lookup_table.json
```

Debe verse así:
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contractAddress": "0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf",
  "timestamp": "2026-02-25T...",
  "gateway": "https://gateway.pinata.cloud",
  "videos": {
    "SB (1).mp4": {
      "cid": "bafybei...",
      "ipfs": "ipfs://bafybei...",
      "gateway": "https://gateway.pinata.cloud/ipfs/bafybei...",
      "fileSize": 15728640,
      "uploadTime": "2026-02-25T..."
    },
    ...
  }
}
```

## Paso 5: Testear en Localhost

```bash
cd frontend
npm run dev
```

Abre http://localhost:3000 y verifica:
- `/mint` muestra preview con 5-25 videos
- `/gallery` muestra composiciones generativas
- `/` explica el concepto

## Tamaños de los Videos

```
SB (1).mp4:  15 MB
SB (2).mp4:  1.3 MB
SB (3).mp4:  1.6 MB
... (total ~25 videos)
```

Total aproximado: **155 MB**

## Combinaciones Generativas

Con 25 videos y 5-25 layers:
- **Mínimo**: 5 videos en una composición
- **Máximo**: todos los 25 videos
- **Combinaciones posibles**: C(25,5) + C(25,6) + ... + C(25,25) = **~33 millones**

Cada seed genera una composición ÚNICA e IRREPRODUCIBLE.

## Problemas Comunes

### "Connection timeout"
→ Los videos son grandes. Intenta con videos más pequeños primero.

### "Invalid API key"
→ Verifica que copiaste correctamente las keys de Pinata.

### "File size too large"
→ Pinata tiene límite por archivo (revisa tu plan).

### ipfs_lookup_table.json no se crea
→ Revisa que `frontend/public/` exista:
```bash
mkdir -p C:/Users/petra/videodanza-nft/frontend/public
```

## Siguientes Pasos

Una vez que tengas los 25 videos subidos:

1. ✅ El motor generativo automáticamente usará los 25 videos
2. ✅ Cada semilla generará combinaciones únicas
3. ✅ Deploy a Vercel
4. ✅ Testear mint en Sepolia

¡Listo!
