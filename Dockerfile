FROM node:10.13-alpine
#ENV NODE_ENV production
WORKDIR /usr/src/app
#COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
COPY . .
RUN npm install
#EXPOSE 3000
#CMD npm run build