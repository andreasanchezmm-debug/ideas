-- Ejecutar después del primer arranque de la aplicación, solo en PostgreSQL.
-- No contiene datos ni delimitaciones de Alicante.
BEGIN;
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE territories ADD COLUMN IF NOT EXISTS municipality_id TEXT GENERATED ALWAYS AS ((data::jsonb ->> 'municipalityId')) STORED;
ALTER TABLE territories ADD COLUMN IF NOT EXISTS geom geometry(MultiPolygon,4326) GENERATED ALWAYS AS (ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(data::jsonb ->> 'geojson'),4326))) STORED;
CREATE INDEX IF NOT EXISTS territories_geom_gist ON territories USING GIST(geom);
CREATE INDEX IF NOT EXISTS territories_municipality ON territories(municipality_id);
ALTER TABLE observations ADD COLUMN IF NOT EXISTS municipality_id TEXT GENERATED ALWAYS AS ((data::jsonb ->> 'municipalityId')) STORED;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS indicator_id TEXT GENERATED ALWAYS AS ((data::jsonb ->> 'indicatorId')) STORED;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS territory_id TEXT GENERATED ALWAYS AS ((data::jsonb ->> 'territoryId')) STORED;
ALTER TABLE observations ADD COLUMN IF NOT EXISTS period TEXT GENERATED ALWAYS AS ((data::jsonb ->> 'period')) STORED;
CREATE UNIQUE INDEX IF NOT EXISTS observations_series_unique ON observations(municipality_id,indicator_id,COALESCE(territory_id,''),period);
CREATE INDEX IF NOT EXISTS observations_city_period ON observations(municipality_id,period);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='territories_city_fk') THEN
  ALTER TABLE territories ADD CONSTRAINT territories_city_fk FOREIGN KEY(municipality_id) REFERENCES municipalities(id);
  ALTER TABLE territories ADD CONSTRAINT territories_valid_geom CHECK(ST_IsValid(geom));
  ALTER TABLE observations ADD CONSTRAINT observations_city_fk FOREIGN KEY(municipality_id) REFERENCES municipalities(id);
  ALTER TABLE observations ADD CONSTRAINT observations_indicator_fk FOREIGN KEY(indicator_id) REFERENCES indicators(id);
  ALTER TABLE observations ADD CONSTRAINT observations_territory_fk FOREIGN KEY(territory_id) REFERENCES territories(id);
 END IF;
END $$;
COMMIT;
