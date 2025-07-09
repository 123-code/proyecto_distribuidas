
FROM node:18-alpine
WORKDIR /app
COPY aplicacion-aprendizaje/frontend/package*.json ./
RUN npm install
COPY aplicacion-aprendizaje/frontend/ .
RUN npm run build
CMD ["npm", "start"]
