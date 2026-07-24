import path from "path";
import { fileURLToPath } from "url";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to search.proto in python-service/protos/search.proto
const PROTO_PATH = path.resolve(__dirname, "../../../python-service/protos/search.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const emailSearchProto = protoDescriptor.emailsearch;

const PYTHON_GRPC_HOST = process.env.PYTHON_GRPC_HOST || "localhost:50051";

export const searchClient = new emailSearchProto.EmailSearchService(
    PYTHON_GRPC_HOST,
    grpc.credentials.createInsecure()
);
