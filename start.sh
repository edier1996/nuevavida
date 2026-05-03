#!/bin/sh
# Replace API URL hardcoded defaults in config.js with Railway environment variables (if set)
CONFIG_FILE="dist/config.js"

if [ -f "$CONFIG_FILE" ]; then
  [ -n "$VITE_USERS_API_BASE_URL" ]    && sed -i "s|https://humorous-essence-production-cf27\.up\.railway\.app|${VITE_USERS_API_BASE_URL}|g" "$CONFIG_FILE"
  [ -n "$VITE_PRODUCTS_API_BASE_URL" ] && sed -i "s|https://product-service-production\.up\.railway\.app|${VITE_PRODUCTS_API_BASE_URL}|g" "$CONFIG_FILE"
  [ -n "$VITE_MESSAGING_API_BASE_URL" ] && sed -i "s|https://messaging-service-production-1fb5\.up\.railway\.app|${VITE_MESSAGING_API_BASE_URL}|g" "$CONFIG_FILE"
  [ -n "$VITE_ORDERS_API_BASE_URL" ]   && sed -i "s|https://order-service-production-3512\.up\.railway\.app|${VITE_ORDERS_API_BASE_URL}|g" "$CONFIG_FILE"
  echo "Config.js final:"
  cat "$CONFIG_FILE"
fi

exec npx serve -s dist -l ${PORT:-8080}
