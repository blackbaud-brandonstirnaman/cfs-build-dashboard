FROM node:argon
ARG BUILD_ID=0

COPY . /app
WORKDIR /app
RUN npm install
RUN npm install --global pm2

EXPOSE 5000/tcp
ENTRYPOINT ["pm2", "start", "-x", "server.js", "--no-daemon"]