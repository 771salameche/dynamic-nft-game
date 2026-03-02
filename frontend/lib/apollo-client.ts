import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const subgraphUri =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/dynamic-nft-game/version/latest';

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: subgraphUri }),
  cache: new InMemoryCache(),
});
