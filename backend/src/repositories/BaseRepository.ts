import { getDatabase } from '../database'
import type { Database } from 'sqlite'

export abstract class BaseRepository {
  protected get db(): Database {
    return getDatabase()
  }

  protected async execute<T = void>(
    sql: string,
    params: (string | number | boolean | null)[] = []
  ): Promise<T extends void ? { changes: number; lastID: number } : T> {
    const result = await this.db.run(sql, params)
    return result as T extends void ? { changes: number; lastID: number } : T
  }

  protected async queryOne<T>(
    sql: string,
    params: (string | number | boolean | null)[] = []
  ): Promise<T | null> {
    const row = await this.db.get<T>(sql, params)
    return row ?? null
  }

  protected async queryAll<T>(
    sql: string,
    params: (string | number | boolean | null)[] = []
  ): Promise<T[]> {
    return this.db.all<T[]>(sql, params)
  }
}
