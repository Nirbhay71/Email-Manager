import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the new search.proto in search_feature_demo/grpc_app/search.proto
const PROTO_PATH = path.resolve(__dirname, "../../../search_feature_demo/grpc_app/search.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const emailSearchV2Proto = protoDescriptor.emailsearch_v2;

// The new hybrid search service runs on port 50052, bound to localhost by
// the Python side — this backend is expected to run on the same host/private network.
const HYBRID_SEARCH_GRPC_HOST = process.env.HYBRID_SEARCH_GRPC_HOST || "localhost:50052";

export const hybridSearchClient = new emailSearchV2Proto.SearchService(
    HYBRID_SEARCH_GRPC_HOST,
    grpc.credentials.createInsecure()
);

/**
 * Metadata carrying the shared service-to-service token, attached to every
 * call the Python search service's _ServiceTokenInterceptor checks for.
 */
export function buildServiceMetadata() {
    const metadata = new grpc.Metadata();
    if (process.env.SERVICE_TOKEN) {
        metadata.set("x-service-token", process.env.SERVICE_TOKEN);
    }
    return metadata;
}
