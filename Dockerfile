# builder
FROM node:16 as builder
WORKDIR /app

COPY package.json yarn.lock ./
# COPY tsconfig.json ./
RUN yarn install

ADD ./src ${workdir}

# production
FROM node:16-alpine
ENV TZ utc

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app
COPY --from=builder /app .

ENV PATH="/app/node_modules/.bin:${PATH}"

ENTRYPOINT ["ts-node"]
CMD ["index.ts"]
