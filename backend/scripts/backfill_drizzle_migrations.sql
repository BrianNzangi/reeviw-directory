CREATE SCHEMA IF NOT EXISTS "drizzle";
CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '2edb6f25f067d3e56472a3128f9c79574422dfcd52171cd82baddefb6b6f8810', 1739990000000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '2edb6f25f067d3e56472a3128f9c79574422dfcd52171cd82baddefb6b6f8810'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '0a274a3a61748e61a721d2dd7ba413d9d4c884e784a59a823d79f3c7123b79b3', 1771759000000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '0a274a3a61748e61a721d2dd7ba413d9d4c884e784a59a823d79f3c7123b79b3'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '45c6618491832396e10e4a77f92cd7d9b5743ef2b952300a56504f5223b216f0', 1771782000000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '45c6618491832396e10e4a77f92cd7d9b5743ef2b952300a56504f5223b216f0'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '9cf0b14daff5bfb087724faab95f6df0d12c46318c8d29a5e298a6d35fe3be39', 1772102400000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '9cf0b14daff5bfb087724faab95f6df0d12c46318c8d29a5e298a6d35fe3be39'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'efd27fda961eb00681876f6a38fb3abcb627926f9cb6d94ab2f92e5041deee2d', 1772114204939
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'efd27fda961eb00681876f6a38fb3abcb627926f9cb6d94ab2f92e5041deee2d'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '8307712a26146db21417233e1183b03410e84888975790ae51f82a85290c1717', 1772126748347
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '8307712a26146db21417233e1183b03410e84888975790ae51f82a85290c1717'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'cc3823b5e0a7c01d5298a3b7ab79edbf15831b87b93056889c8ccd5e65cde160', 1772219477008
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'cc3823b5e0a7c01d5298a3b7ab79edbf15831b87b93056889c8ccd5e65cde160'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'b0db681a6dd991ea763e63d5593ec839b7e1f757adb6048589de2de1c8ab5957', 1772220174253
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'b0db681a6dd991ea763e63d5593ec839b7e1f757adb6048589de2de1c8ab5957'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '24c768a440d362c138aa7a7c86563c865d92e2281bb56305231376727eae8626', 1772221417334
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '24c768a440d362c138aa7a7c86563c865d92e2281bb56305231376727eae8626'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'fe0adbd5191c1c4a9887fa026eab3d251a1fb71058a91a09dfa4e9bcd129bbfe', 1772280923212
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'fe0adbd5191c1c4a9887fa026eab3d251a1fb71058a91a09dfa4e9bcd129bbfe'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'a3677f860cbbc1d10d64d3ef0da0db966424aec4ab1b4aaeb0c1b15664f24375', 1772280923212
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'a3677f860cbbc1d10d64d3ef0da0db966424aec4ab1b4aaeb0c1b15664f24375'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '30ae39a4067cf47ba791fc616ba972ac2603f0c3351025979ea275db1e6eeb0f', 1772280923212
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '30ae39a4067cf47ba791fc616ba972ac2603f0c3351025979ea275db1e6eeb0f'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '6b0e28aadbb4eddeda3753b2303df5ca1ec463cf6ab70e19776c19bbc7651491', 1772292000000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '6b0e28aadbb4eddeda3753b2303df5ca1ec463cf6ab70e19776c19bbc7651491'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT 'a257b2f2e91dc01637dcc1602cdde06b79c334e133e650bfce347ab4d6049d38', 1772310000000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = 'a257b2f2e91dc01637dcc1602cdde06b79c334e133e650bfce347ab4d6049d38'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '7ccfbf3f6eb27b72bb9c9882dc2bac8a2420aea2a2c9aeb4124dcabd9db06a62', 1772312400000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '7ccfbf3f6eb27b72bb9c9882dc2bac8a2420aea2a2c9aeb4124dcabd9db06a62'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '8763c093986091344b72510d1e02754c0af21bcfabbcb7f5a9ce6c3b0362b4f6', 1772314200000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '8763c093986091344b72510d1e02754c0af21bcfabbcb7f5a9ce6c3b0362b4f6'
);

INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
SELECT '4017be4bb64d67113d36c17aa5cdc5f65af9a73831b7ef15599c7c8f9b95f928', 1772317200000
WHERE NOT EXISTS (
  SELECT 1 FROM "drizzle"."__drizzle_migrations"
  WHERE "hash" = '4017be4bb64d67113d36c17aa5cdc5f65af9a73831b7ef15599c7c8f9b95f928'
);
