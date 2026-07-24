FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agendaya

RUN npx prisma generate

EXPOSE 3000

CMD ["npx", "next", "dev", "--turbopack", "-p", "3000"]
