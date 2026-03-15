FROM node:20-alpine

WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=2048"

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
