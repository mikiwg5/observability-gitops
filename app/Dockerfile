FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com \
 && npm install

COPY . .

CMD ["node", "--require", "./instrumentation.js", "app.js"]
