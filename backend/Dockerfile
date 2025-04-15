FROM node:18
WORKDIR /backend
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install express cors body-parser multer twilio fast2sms
COPY . .
EXPOSE 5000
CMD [ "node", "index.js" ]
