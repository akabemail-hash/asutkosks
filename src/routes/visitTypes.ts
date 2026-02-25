import express from 'express';
import { supabase } from '../db/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { data: types, error } = await supabase
      .from('visit_types')
      .select('*');

    if (error) throw error;

    res.json(types);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  try {
    const { data, error } = await supabase
      .from('visit_types')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('visit_types')
      .update({ name })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Visit type updated' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('visit_types')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Visit type deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
