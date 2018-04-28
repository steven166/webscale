FROM node:9.11.1-alpine

WORKDIR /app

ADD package.json yarn.lock ./
RUN yarn --frozen-lockfile

ADD tslint.json tsconfig.json tsconfig.build.json README.md ./

CMD yarn run watch