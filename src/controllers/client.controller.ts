import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { clientSchemaReg } from '../validations/client.validation';

export const registerClient = async (req: Request, res: Response) => {
  const { error } = clientSchemaReg.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email} = req.body;

  try {

    const result = await pool.query(
      'INSERT INTO clients (username, email) VALUES ($1, $2) RETURNING id, username, email',
      [username, email]
    );

    res.status(201).json({
      message: 'Client registered',
      user: result.rows[0], // Contient id, username, email
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};