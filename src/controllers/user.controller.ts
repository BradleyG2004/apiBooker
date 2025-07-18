import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db';
import { userSchemaReg,userSchemaLog } from '../validations/user.validation';

export const registerUser = async (req: Request, res: Response) => {
  const { error } = userSchemaReg.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered',
      user: result.rows[0], // Contient id, username, email
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { error } = userSchemaLog.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered',
      user: result.rows[0], // Contient id, username, email
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
