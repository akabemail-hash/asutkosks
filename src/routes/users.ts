import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../db/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id, 
        username, 
        role_id, 
        language, 
        created_at, 
        roles (name)
      `);
    
    if (error) throw error;

    const formattedUsers = users.map((u: any) => ({
      ...u,
      role_name: u.roles?.name
    }));

    res.json(formattedUsers);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { username, password, role_id, language } = req.body;
  
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword, role_id, language: language || 'en' })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ id: data.id, username, role_id, language });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { username, password, role_id, language } = req.body;
  const { id } = req.params;

  try {
    const updates: any = { username, role_id, language };
    if (password) {
      updates.password = bcrypt.hashSync(password, 10);
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User updated' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
