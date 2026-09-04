# Blockers

## [backend/src/server.ts] MongoDB Atlas connection refused | IP not on cluster access list

**Status:** OPEN — requires action in the MongoDB Atlas console (cannot be fixed from code).

**Exact error:**
```
Failed to start server: MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster.
One common reason is that you're trying to access the database from an IP that isn't whitelisted.

SERVER ac-qivtuek-shard-00-00.r4ngvgh.mongodb.net:27017 -> D0680000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error:openssl\ssl\record\rec_layer_s3.c:918:SSL alert number 80
SERVER ac-qivtuek-shard-00-01.r4ngvgh.mongodb.net:27017 -> (same)
SERVER ac-qivtuek-shard-00-02.r4ngvgh.mongodb.net:27017 -> (same)
```

**Diagnosis:**
- SRV record resolves correctly; all three shard hostnames were discovered.
- TCP to `ac-qivtuek-shard-00-00.r4ngvgh.mongodb.net:27017` is **OPEN**, so this is not a local firewall or DNS problem.
- The server terminates the TLS handshake with alert 80. Atlas returns exactly this when the connecting IP is absent from the project's Network Access list.
- Credentials were never exercised — the connection dies before authentication.

**This machine's public IP:** `103.54.42.19`

**Fix (Atlas console, ~1 minute):**
Atlas → Project → Network Access → Add IP Address → either "Add Current IP Address", or `0.0.0.0/0` to allow from anywhere for the hackathon → Confirm. Takes ~30s to become active.

**No local fallback available:** `mongod` is not on PATH, Docker is not installed, and nothing is listening on 127.0.0.1:27017.

**Unaffected work:** the frontend, agent code, and all route logic are independent of this and continue. Only runtime verification of T06, T08–T20 and T25 is gated on the connection.
