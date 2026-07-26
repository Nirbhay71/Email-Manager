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

// The new hybrid search service runs on port 50052
const HYBRID_SEARCH_GRPC_HOST = process.env.HYBRID_SEARCH_GRPC_HOST || "localhost:50052";

export const hybridSearchClient = new emailSearchV2Proto.SearchService(
    HYBRID_SEARCH_GRPC_HOST,
    grpc.credentials.createInsecure()
);
