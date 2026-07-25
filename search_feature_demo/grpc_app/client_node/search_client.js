/**
 * Node.js gRPC client for the AI Email Search Service.
 *
 * Connects to the Python search gRPC server (default port 50052)
 * and provides a Promise-based wrapper around the Search RPC.
 *
 * Usage:
 *   import { search } from './search_client.js';
 *
 *   const results = await search({
 *     query: 'emails from Sarah about Q3 budget',
 *     user_email: 'user@example.com',
 *     limit: 20,
 *     offset: 0,
 *   });
 *   console.log(results);
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to search.proto — one directory up from client_node/
const PROTO_PATH = path.resolve(__dirname, '../search.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const searchProto = protoDescriptor.emailsearch_v2;

const SEARCH_GRPC_HOST = process.env.SEARCH_GRPC_HOST || 'localhost:50052';

/**
 * gRPC client instance for the SearchService.
 */
export const searchClient = new searchProto.SearchService(
  SEARCH_GRPC_HOST,
  grpc.credentials.createInsecure()
);

/**
 * Execute a search query via gRPC.
 *
 * @param {object} params - Search parameters.
 * @param {string} params.query - The search query string.
 * @param {string} params.user_email - Authenticated user's email.
 * @param {number} [params.limit=20] - Max results to return.
 * @param {number} [params.offset=0] - Pagination offset.
 * @returns {Promise<object>} SearchResponse with results, total, interpretation, timings.
 */
export function search({ query, user_email, limit = 20, offset = 0 }) {
  return new Promise((resolve, reject) => {
    searchClient.Search(
      { query, user_email, limit, offset },
      (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      }
    );
  });
}

// ── Example usage ──────────────────────────────────────────────────────────
// Run directly: node search_client.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      console.log('🔍 Searching for: "emails from Sarah about budget"');
      const result = await search({
        query: 'emails from Sarah about budget',
        user_email: 'test@example.com',
      });
      console.log('📧 Results:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('❌ Search failed:', err.message);
    }
  })();
}
