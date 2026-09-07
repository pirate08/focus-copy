/*
# Seed UPSC subject tree

1. Data Changes
- Adds the eight default UPSC subjects.
- Adds representative chapters and topics for navigation and syllabus tracking.

2. Safety
- Inserts only when matching names do not already exist.
- No existing rows are modified or removed.
*/

INSERT INTO subjects (name, icon, sort_order)
SELECT name, icon, sort_order
FROM (VALUES
  ('Polity', 'landmark', 1),
  ('Geography', 'mountain', 2),
  ('History', 'scroll-text', 3),
  ('Economy', 'chart-no-axes-combined', 4),
  ('Environment', 'leaf', 5),
  ('Ethics', 'scale', 6),
  ('International Relations', 'globe-2', 7),
  ('Optional Subject', 'book-open', 8)
) AS seed(name, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subjects.name = seed.name);

WITH subject_ids AS (
  SELECT id, name FROM subjects
), chapter_seed AS (
  SELECT * FROM (VALUES
    ('Polity', 'Constitutional Framework'),
    ('Polity', 'Governance & Rights'),
    ('Geography', 'Physical Geography'),
    ('Geography', 'Indian Geography'),
    ('History', 'Modern India'),
    ('History', 'Ancient & Medieval India'),
    ('Economy', 'Macroeconomics'),
    ('Environment', 'Ecology & Biodiversity'),
    ('Ethics', 'Foundations of Ethics'),
    ('International Relations', 'India and the World'),
    ('Optional Subject', 'Optional Subject Notes')
  ) AS rows(subject_name, topic_name)
)
INSERT INTO topics (subject_id, name, sort_order)
SELECT s.id, c.topic_name, row_number() OVER (PARTITION BY s.id ORDER BY c.topic_name)
FROM chapter_seed c
JOIN subject_ids s ON s.name = c.subject_name
WHERE NOT EXISTS (
  SELECT 1 FROM topics t WHERE t.subject_id = s.id AND t.parent_id IS NULL AND t.name = c.topic_name
);

WITH geography AS (SELECT id FROM subjects WHERE name = 'Geography' LIMIT 1),
physical AS (SELECT t.id FROM topics t JOIN geography s ON t.subject_id = s.id WHERE t.name = 'Physical Geography' AND t.parent_id IS NULL LIMIT 1)
INSERT INTO topics (subject_id, parent_id, name, sort_order)
SELECT geography.id, physical.id, 'Geomorphology', 1 FROM geography, physical
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE parent_id = physical.id AND name = 'Geomorphology');

WITH geomorphology AS (
  SELECT t.id, t.subject_id FROM topics t WHERE t.name = 'Geomorphology' AND t.parent_id IS NOT NULL LIMIT 1
)
INSERT INTO topics (subject_id, parent_id, name, sort_order)
SELECT subject_id, id, 'Plate Tectonics', 1 FROM geomorphology
WHERE NOT EXISTS (SELECT 1 FROM topics WHERE parent_id = geomorphology.id AND name = 'Plate Tectonics');
