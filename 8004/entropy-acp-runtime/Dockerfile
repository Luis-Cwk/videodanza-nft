FROM node:22-bookworm-slim

# CLI oficial de ACP: el worker la invoca como proceso hijo, igual que en Windows.
RUN npm i -g @virtuals-protocol/acp-cli@1.0.40

WORKDIR /app
COPY package.json worker.mjs lectura.mjs ./

# Shell/SSH de Render necesita este directorio en el $HOME real (no en el disco).
RUN mkdir -p /root/.ssh && chmod 0700 /root/.ssh

# Sesion ACP, keychain y logs viven en el disco persistente (/var/data).
# En un contenedor no hay Secret Service: cross-keychain usa su backend de archivo.
# Ojo: el disco NO puede montarse en $HOME, de ahi XDG_CONFIG_HOME.
ENV XDG_CONFIG_HOME=/var/data/.config \
    ACP_CONFIG_DIR=/var/data/acp \
    ACP_LOG_DIR=/var/data \
    TS_KEYRING_BACKEND=file

CMD ["node", "worker.mjs"]
