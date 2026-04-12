FROM node:20-alpine

# Install build tools for native modules like bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install bcryptjs with build tools
RUN npm install bcryptjs@2.4.3

COPY . .

EXPOSE 3002

CMD ["sh", "-c", "npm install && npm run dev"]
