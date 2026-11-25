# syntax=docker/dockerfile:1
FROM node:24-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . ./

VOLUME /usr/src/app/data

EXPOSE 8080

CMD [ "npm", "start" ]
