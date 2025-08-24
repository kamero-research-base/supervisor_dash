// app/api/utils/db.ts
import { Pool, PoolClient } from 'pg';

class DatabaseConnection {
  private pool: Pool;
  private static instance: DatabaseConnection;

  private constructor() {
    if (!process.env.DATABASE_URL) {
      console.error('Error: DATABASE_URL is not defined in the environment variables.');
      throw new Error('DATABASE_URL is required but not set.');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      min: 2,  // Minimum number of clients in the pool
      connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      allowExitOnIdle: true, // Allow the pool to close all connections and exit when all clients are idle
    });

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });

    // Handle pool connection events
    this.pool.on('connect', () => {
      console.log('New client connected to the database pool');
    });

    this.pool.on('acquire', () => {
      console.log('Client acquired from the pool');
    });

    this.pool.on('release', () => {
      console.log('Client released back to the pool');
    });

    console.log('Database connection pool initialized successfully.');
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  // Method to execute queries
  public async query(text: string, params?: any[]): Promise<any> {
    let client: PoolClient | null = null;
    
    try {
      client = await this.pool.connect();
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      if (client) {
        client.release(); // Return client to pool
      }
    }
  }

  // Method to execute transactions
  public async transaction(callback: (client: PoolClient) => Promise<any>): Promise<any> {
    let client: PoolClient | null = null;
    
    try {
      client = await this.pool.connect();
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Transaction error:', error);
      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Method to check pool status
  public getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  // Method to close the pool (useful for cleanup)
  public async close(): Promise<void> {
    console.log('Closing database connection pool...');
    await this.pool.end();
  }
}

// Create a wrapper that mimics the old client interface
class ClientWrapper {
  private db: DatabaseConnection;

  constructor() {
    this.db = DatabaseConnection.getInstance();
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      return await this.db.query(text, params);
    } catch (error) {
      // Log the error for debugging but don't crash the app
      console.error('Query failed:', {
        error: error instanceof Error ? error.message : error,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: params?.length ? `${params.length} parameters` : 'no parameters'
      });
      throw error;
    }
  }

  // Support for transactions
  async transaction(callback: (client: PoolClient) => Promise<any>): Promise<any> {
    return await this.db.transaction(callback);
  }

  // Get connection pool status
  getStatus() {
    return this.db.getPoolStatus();
  }

  // Close connections (for cleanup)
  async end(): Promise<void> {
    return await this.db.close();
  }
}

// Export a single instance
const client = new ClientWrapper();

export default client;

// Also export the types for use in other files
export type { PoolClient } from 'pg';