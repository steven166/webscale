FROM node:9.11.1-alpine

WORKDIR /app/webscale-core
ADD webscale-core/dist/package.json ./
RUN yarn link

WORKDIR /app/webscale-server-discovery
ADD webscale-server-discovery/dist/package.json ./
RUN yarn link

ARG NAME
WORKDIR /app/$NAME
ADD $NAME/package.json $NAME/yarn.lock ./
RUN yarn link @webscale/core && \
    yarn link @webscale/server-discovery && \
    yarn --frozen-lockfile

ADD $NAME/tslint.json $NAME/tsconfig.json $NAME/tsconfig.build.json $NAME/README.md ./

CMD yarn run watch