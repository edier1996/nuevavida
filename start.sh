#!/bin/sh
# Replace API URL placeholders in config.js with Railway environment variables
CONFIG_FILE="dist/config.js"

if [ -f "$CONFIG_FILE" ]; then
  sed -i "s|__VITE_USERS_API_BASE_URL__|${VITE_USERS_API_BASE_URL:-}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_PRODUCTS_API_BASE_URL__|${VITE_PRODUCTS_API_BASE_URL:-}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_MESSAGING_API_BASE_URL__|${VITE_MESSAGING_API_BASE_URL:-}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_ORDERS_API_BASE_URL__|${VITE_ORDERS_API_BASE_URL:-}|g" "$CONFIG_FILE"
  sed -i "s|__VITE_ADMIN_API_BASE_URL__|${VITE_ADMIN_API_BASE_URL:-}|g" "$CONFIG_FILE"
  echo "Config.js updated with env vars"
  cat "$CONFIG_FILE"
fi

exec npx serve -s dist -l ${PORT:-8080}
