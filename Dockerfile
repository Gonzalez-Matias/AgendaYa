FROM node:20-alpine

RUN apk add --no-cache tzdata
ENV TZ=America/Argentina/Buenos_Aires

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate

RUN mkdir -p /app/.next && chown -R node:node /app

EXPOSE 3000

USER node

CMD ["npx", "next", "dev", "--turbopack", "-p", "3000"]
