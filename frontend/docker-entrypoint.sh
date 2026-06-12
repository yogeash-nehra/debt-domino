#!/bin/sh
set -e

if [ -n "$API_URL" ]; then
  envsubst '${API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
else
  echo "WARNING: API_URL is not set — /api calls will not be proxied. Set API_URL in Render to point to your backend." >&2
  cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    error_page 404 /index.html;
}
NGINX
fi

exec nginx -g 'daemon off;'
