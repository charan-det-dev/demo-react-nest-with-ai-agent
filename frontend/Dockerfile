# Dev-mode Dockerfile: runs the Vite dev server (matches docker-compose.yml,
# which maps port 5173 and passes VITE_API_URL at runtime).
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
