# Migrar el runtime ACP a Render (background worker)

El worker pasa de esta máquina a un worker de Render con disco persistente. Deja de
depender de la PC encendida y del watchdog de Windows (`EntropyAcpRuntime.vbs`).

Costo: plan Starter del worker (7 USD/mes) + disco de 1 GB (0.25 USD/mes). No hay
opción gratis: el plan free de Render solo cubre web services, y un web service gratis
duerme a los 15 minutos, así que dejaría de consultar jobs.

## 1. Crear el servicio

Dashboard de Render, workspace "My Workspace":

- New, Background Worker (no web service: no escucha puerto).
- Repo `Luis-Cwk/videodanza-nft`, branch `master`, root directory `8004/entropy-acp-runtime`.
- Runtime: Docker.
- Region: Oregon (la misma del bot de Discord).
- Plan: Starter.
- Advanced, Add Disk: nombre `acp-state`, mount path `/var/data`, 1 GB.

## 2. Variables de entorno

Obligatorias:

| Variable | Valor |
|---|---|
| `GROQ_API_KEY` | la del `.env` local (secreto, no se escribe acá) |
| `ACP_AGENT_ID` | `01a16777-0f37-71d6-b2af-ebc5d6019abf` |

Opcionales, con default en el código: `LLM_PROVIDER` (groq), `ACP_LLM_MODEL`,
`ACP_CHAIN_ID` (8453), `ACP_POLL_MS` (5000), `ACP_AGENT_WALLET`, `ACP_FALLBACK_PRICE`,
`ACP_TEST_JOB_IDS`, `BROWSERBASE_API_KEY` (fallback de lectura de páginas).

`HOME`, `XDG_CONFIG_HOME`, `ACP_CONFIG_DIR`, `ACP_LOG_DIR` y `TS_KEYRING_BACKEND` ya
vienen en el Dockerfile. No tocarlas.

## 3. Primera sesión (sin shell)

Al arrancar sin credenciales, el worker detecta que `acp agent whoami` falla, corre
`acp configure start --json` e imprime en el log:

    Abre esta URL y aprueba la sesion de ACP: https://...

Se abre ese enlace en Brave, se aprueba, y el worker sigue solo (espera hasta 15 min).

## 4. Signer de la máquina (una vez)

El signer que hoy existe vive en el Administrador de credenciales de Windows: no viaja.
En el servidor hay que crear uno nuevo. En el dashboard, pestaña Shell del worker:

```bash
acp agent add-signer --agent-id 01a16777-0f37-71d6-b2af-ebc5d6019abf --policy restricted
```

Imprime una URL de aprobación: se abre en Brave y se confirma. La clave privada queda
en `/var/data/.config/keyring/secrets.json` (disco), no en la imagen. Reiniciar el
servicio después.

## 5. Verificar

En los logs:

    Runtime de Entropy iniciado en chain 8453.

Y cada 5 segundos corre `acp job list`. Si el agente activo no es Entropy, el worker
falla con el mensaje que dice qué comando correr.

## 6. Apagar lo de esta máquina

Solo cuando el worker de Render esté dando vueltas:

1. Borrar `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\EntropyAcpRuntime.vbs`.
2. Matar el watchdog y el worker filtrando por línea de comandos, nunca por nombre:

```powershell
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'watchdog-loop\.ps1|worker\.mjs' } | Select-Object ProcessId,CommandLine
# revisar la lista, después:
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'watchdog-loop\.ps1|worker\.mjs' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

La carpeta local se queda como referencia; el `.vbs` es lo único que la vuelve a arrancar.

## Límites conocidos

- Sin disco persistente la sesión y el signer se pierden en cada deploy y habría que
  reaprobar todo. El disco no es opcional.
- El disco impide deploys sin downtime: el worker se detiene unos segundos al desplegar.
- Si se pierde el disco, hay que repetir los pasos 3 y 4.
- La wallet de Entropy sigue en 0 USD: el worker solo cobra cuando un cliente fondea.
