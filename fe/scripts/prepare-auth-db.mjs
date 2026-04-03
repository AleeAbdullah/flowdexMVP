import process from 'node:process';
import nextEnv from '@next/env';
import pg from 'pg';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const client = new pg.Client({ connectionString });

await client.connect();
await client.query('CREATE SCHEMA IF NOT EXISTS fe_auth');
await client.end();
