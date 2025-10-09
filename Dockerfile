FROM node:20-alpine


WORKDIR /Connect_4
COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /Connect_4/server
RUN npx tsc server.ts

WORKDIR /Connect_4

EXPOSE 6300 6400

CMD ["sh", "-c", "npm run build & npm run start & npm run dev"]
