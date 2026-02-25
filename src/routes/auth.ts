import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (name, permissions)
      `)
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const roleName = user.roles?.name;
    const permissions = user.roles?.permissions ? JSON.parse(user.roles.permissions) : [];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: roleName, permissions },
      JWT_SECRET,
      { expiresIn: rememberMe ? '7d' : '1h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: 'none', // Required for cross-origin iframe
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000 // 7 days or 1 hour
    });

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: roleName, 
        language: user.language,
        permissions
      } 
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (name, permissions)
      `)
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleName = user.roles?.name;
    const permissions = user.roles?.permissions ? JSON.parse(user.roles.permissions) : [];

    res.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: roleName, 
        language: user.language,
        permissions
      } 
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
