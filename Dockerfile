FROM node:20-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-pandas python3-openpyxl python3-pypdf \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY public ./public
COPY tools ./tools
COPY server.js README.md ./

ENV PORT=5173
EXPOSE 5173

CMD ["node", "server.js"]
