#!/bin/sh
set -e

if [ -z "$API_URL" ]; then
  echo "ERROR: API_URL environment variable is required (e.g. https://your-api.onrender.com)" >&2
  exit 1
fi

envsubst '${API_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
