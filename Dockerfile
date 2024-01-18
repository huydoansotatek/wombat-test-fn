FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3002
CMD ["yarn", "start"]
