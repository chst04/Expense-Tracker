/**
 * SQLite Service using sql.js
 * Provides persistence for transactions and user settings.
 */
import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;

export const initDB = async () => {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
  });

  const savedData = localStorage.getItem('sqlite-db');
  if (savedData) {
    const uint8Array = new Uint8Array(JSON.parse(savedData));
    db = new SQL.Database(uint8Array);
  } else {
    db = new SQL.Database();
    // Initialize schema
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        userId TEXT,
        amount REAL,
        type TEXT,
        category TEXT,
        date TEXT,
        description TEXT
      );
    `);
    saveDB();
  }
  return db;
};

export const saveDB = () => {
  if (db) {
    const data = db.export();
    localStorage.setItem('sqlite-db', JSON.stringify(Array.from(data)));
  }
};

export const addTransactionDB = async (t: any, userId: string) => {
  const database = await initDB();
  database.run(
    "INSERT INTO transactions (id, userId, amount, type, category, date, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [t.id, userId, t.amount, t.type, t.category, t.date, t.description]
  );
  saveDB();
};

export const getTransactionsDB = async (userId: string) => {
  const database = await initDB();
  const res = database.exec("SELECT * FROM transactions WHERE userId = ?", [userId]);
  if (res.length === 0) return [];
  
  const columns = res[0].columns;
  const values = res[0].values;
  
  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

export const deleteTransactionDB = async (id: string) => {
  const database = await initDB();
  database.run("DELETE FROM transactions WHERE id = ?", [id]);
  saveDB();
};
