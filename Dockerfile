FROM node
WORKDIR /usr/src
COPY . .
EXPOSE 5000
RUN npm i
RUN npx prisma generate
RUN npx prisma db push
RUN npx prisma db seed
RUN npm run build
CMD [ "npm", "start" ]