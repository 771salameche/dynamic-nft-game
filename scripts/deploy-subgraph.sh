#!/bin/bash

# Authenticate with The Graph Studio
graph auth --studio $SUBGRAPH_DEPLOY_KEY

# Deploy to Studio
graph deploy --studio dynamic-nft-game

echo "Subgraph deployed successfully!"
echo "View at: https://thegraph.com/studio/subgraph/dynamic-nft-game"
