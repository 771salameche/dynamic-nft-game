import { ApolloClient, InMemoryCache } from '@apollo/client';

export const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/dynamic-nft-game/version/latest',
  cache: new InMemoryCache(),
});
