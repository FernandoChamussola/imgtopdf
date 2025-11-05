FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema para Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

COPY package*.json ./
RUN npm install

COPY . .

# Criar pastas
RUN mkdir -p uploads output

EXPOSE 4000

CMD ["node", "index.js"]