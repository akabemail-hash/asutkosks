import express from 'express';
import { supabase } from '../db/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const { data: roles, error } = await supabase
      .from('roles')
      .select('*');

    if (error) throw error;

    const parsedRoles = roles.map((role: any) => ({
      ...role,
      permissions: role.permissions ? JSON.parse(role.permissions) : []
    }));
    res.json(parsedRoles);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, permissions } = req.body;
  try {
    const { data, error } = await supabase
      .from('roles')
      .insert({ name, permissions: JSON.stringify(permissions) })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, permissions } = req.body;
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('roles')
      .update({ name, permissions: JSON.stringify(permissions) })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Role updated' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Role deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
