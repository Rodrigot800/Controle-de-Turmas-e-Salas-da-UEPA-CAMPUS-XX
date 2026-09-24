FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache poppler-utils

RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
