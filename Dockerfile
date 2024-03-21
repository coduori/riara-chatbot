FROM --platform=linux/amd64 node:18.12.1-alpine

ENV APP_DIR /opt/app
ENV NODE_ENV production
WORKDIR ${APP_DIR}
COPY . ${APP_DIR}
RUN npm install
CMD [ "npm", "start" ]