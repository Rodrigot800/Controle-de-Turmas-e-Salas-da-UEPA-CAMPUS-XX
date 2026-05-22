# Fase 1: Build da aplicação React/Vite
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Faz o build para a pasta dist
RUN npm run build

# Fase 2: Servidor Nginx
FROM nginx:alpine

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cria a pasta de certificados e copia as chaves SSL
RUN mkdir -p /etc/nginx/certs
COPY 192.168.10.231.pem /etc/nginx/certs/
COPY 192.168.10.231-key.pem /etc/nginx/certs/

# Copia os arquivos estáticos gerados no build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
EXPOSE 3001

CMD ["nginx", "-g", "daemon off;"]
