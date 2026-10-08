FROM nginx:alpine

# Static game: just serve the files.
COPY index.html game.js sound_manager.js style.css /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets

RUN sed -i 's/listen  *80;/listen 8080;/' /etc/nginx/conf.d/default.conf
EXPOSE 8080
