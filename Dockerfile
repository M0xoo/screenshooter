# Browser binaries match playwright in server/package.json (^1.49.x).
FROM mcr.microsoft.com/playwright:v1.49.1-jammy

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY client/package.json client/package.json

RUN npm ci

COPY shared ./shared
COPY server ./server
COPY client ./client

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
