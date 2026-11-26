FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV DATA_FILE=/data/todos.json
RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 4000
CMD ["node", "src/server.js"]