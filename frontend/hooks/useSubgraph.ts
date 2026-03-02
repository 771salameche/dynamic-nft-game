'use client';

import { useEffect, useState } from 'react';

const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/dynamic-nft-game/version/latest';

type QueryState<T> = {
  data?: T;
  loading: boolean;
  error?: Error;
};

async function fetchSubgraph<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Subgraph request failed with status ${res.status}`);
  }

  const json = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || 'Subgraph returned an error');
  }

  return json.data as T;
}

export function useTopCharacters() {
  const [state, setState] = useState<QueryState<{ characters: any[] }>>({
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const query = `
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
    `;

    fetchSubgraph<{ characters: any[] }>(query)
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function usePlayerStats(address?: string) {
  const [state, setState] = useState<QueryState<{ player: any }>>({
    loading: !!address,
  });

  useEffect(() => {
    if (!address) {
      setState({ loading: false });
      return;
    }

    let cancelled = false;

    const query = `
      query PlayerStats($address: String!) {
        player(id: $address) {
          id
          characters { tokenId level }
          totalRewardsEarned
          achievementCount
        }
      }
    `;

    fetchSubgraph<{ player: any }>(query, { address: address.toLowerCase() })
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({ loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return state;
}
