# Dockerfile for Connect_4 client (React)
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /app/src

EXPOSE 6300

CMD ["npm", "run", "dev"]
