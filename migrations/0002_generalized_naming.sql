-- Migrate legacy cleaning-template column/value names to generalized schema.
-- Run once on existing D1 databases that used home_size / 1br slugs / free_clean / essential service keys.

ALTER TABLE bookings RENAME COLUMN home_size TO size_key;

UPDATE bookings SET service = 'tier1' WHERE service = 'essential';
UPDATE bookings SET service = 'tier2' WHERE service = 'signature';
UPDATE bookings SET service = 'tier3' WHERE service IN ('premier', 'deep');
UPDATE bookings SET service = 'tier4' WHERE service = 'ultimate';
UPDATE bookings SET service = 'biz_tier1' WHERE service = 'biz_essential';
UPDATE bookings SET service = 'biz_tier2' WHERE service = 'biz_signature';
UPDATE bookings SET service = 'biz_tier3' WHERE service IN ('biz_premier', 'biz_deep');
UPDATE bookings SET service = 'biz_tier4' WHERE service = 'biz_ultimate';

UPDATE bookings SET size_key = 's1' WHERE size_key IN ('1br', 'studio');
UPDATE bookings SET size_key = 's2' WHERE size_key = '2br';
UPDATE bookings SET size_key = 's3' WHERE size_key = '3br';
UPDATE bookings SET size_key = 's4' WHERE size_key IN ('4br', '5br_plus');

UPDATE promo_codes SET type = 'complimentary' WHERE type = 'free_clean';
