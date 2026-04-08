#!/bin/bash
# Simple webhook server that listens for POST /update-wildcard
# Starts a netcat-based HTTP server on port 9876
# Run with: sudo bash ~/factory/scripts/deploy-hook-server.sh

SECRET="hazelgrouse-deploy-hook"
PORT=9876
SCRIPT="$(dirname "$0")/update-prod-wildcard.sh"

echo "Webhook server listening on port $PORT..."

while true; do
  REQUEST=$(nc -l -p $PORT -q 1)
  TOKEN=$(echo "$REQUEST" | grep "X-Hook-Secret:" | tr -d '\r' | awk '{print $2}')

  if [ "$TOKEN" = "$SECRET" ]; then
    echo "Valid hook received, updating wildcard IP..."
    bash "$SCRIPT"
    RESPONSE="HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK"
  else
    RESPONSE="HTTP/1.1 403 Forbidden\r\nContent-Length: 9\r\n\r\nForbidden"
  fi

  echo -e "$RESPONSE" | nc -l -p $PORT -q 1 > /dev/null
done
