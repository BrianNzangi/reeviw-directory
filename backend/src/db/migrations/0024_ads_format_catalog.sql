INSERT INTO "ad_slots" ("slug", "device", "description") VALUES
  ('half_page', 'all', 'A tall, impactful ad unit that attracts user attention and delivers higher viewability.'),
  ('leaderboard', 'all', 'A wide banner that fits the top section of the website for immediate visibility.'),
  ('rectangle', 'all', 'A flexible and high-performing ad format that fits seamlessly within content or sidebars.'),
  ('skyscraper', 'all', 'A vertical ad format designed for sidebars that stays visible while users scroll.'),
  ('billboard', 'all', 'A large, eye-catching format typically placed above the fold for high-impact branding.')
ON CONFLICT ("slug", "device") DO UPDATE
SET "description" = EXCLUDED."description";
