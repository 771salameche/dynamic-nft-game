import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

export function useTopCharacters() {
  return useQuery(gql`
    query TopCharacters {
      characters(first: 100, orderBy: level, orderDirection: desc) {
        id
        tokenId
        level
        powerScore
        owner {
          id
        }
      }
    }
  `);
}

export function usePlayerStats(address?: string) {
  return useQuery(
    gql`
      query PlayerStats($address: String!) {
        player(id: $address) {
          id
          characters { tokenId level }
          totalRewardsEarned
          achievementCount
        }
      }
    `,
    { variables: { address: address?.toLowerCase() }, skip: !address }
  );
}
