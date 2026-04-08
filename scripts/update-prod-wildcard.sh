#!/bin/bash
# Run after every Coolify redeploy to update the container IP in prod-wildcard.yaml
# Usage: sudo ./scripts/update-prod-wildcard.sh

CONTAINER=$(docker ps --format "{{.Names}}" | grep "zk88skgsc8s0gc044sg4gc0w" | grep -v proxy)
IP=$(docker inspect "$CONTAINER" | grep -A20 '"Networks"' | grep '"IPAddress"' | tail -1 | tr -d ' ",' | cut -d: -f2)

if [ -z "$IP" ]; then
  echo "ERROR: Could not find container IP"
  exit 1
fi

echo "Container: $CONTAINER"
echo "IP: $IP"

sed -i "s|url: 'http://[0-9.]*:3000'|url: 'http://$IP:3000'|" /data/coolify/proxy/dynamic/prod-wildcard.yaml

echo "Updated prod-wildcard.yaml with IP $IP"
cat /data/coolify/proxy/dynamic/prod-wildcard.yaml | grep url
