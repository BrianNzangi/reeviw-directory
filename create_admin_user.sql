INSERT INTO "user" (id, email, email_verified) 
VALUES ('12345678-1234-1234-1234-123456789012', 'admin@reeviw.com', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO account (id, account_id, provider_id, user_id, password) 
VALUES ('12345678-1234-1234-1234-123456789013', 'email', 'email', '12345678-1234-1234-1234-123456789012', 'ChangeMe26!')
ON CONFLICT (provider_id, account_id) DO UPDATE SET password = EXCLUDED.password;