FROM node:20-alpine AS build
WORKDIR /app
# Baked into the bundle by Vite, so it's a build argument, not a runtime variable.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_APP_VARIANT
ENV VITE_APP_VARIANT=$VITE_APP_VARIANT
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
