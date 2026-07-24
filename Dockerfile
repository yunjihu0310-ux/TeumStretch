FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=4187 HOST=0.0.0.0 DATA_DIR=/data
EXPOSE 4187
VOLUME ["/data"]
CMD ["npm", "start"]
