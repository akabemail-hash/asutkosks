import express from 'express';
import { supabase } from '../db/supabase';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

router.use(authenticateToken);

router.post('/', upload.array('photos', 2), async (req: any, res) => {
  const { kiosk_id, visit_date, visit_time, visit_type_id, problem_type_id, description } = req.body;
  const user_id = req.user.id;
  
  const photos = req.files ? JSON.stringify(req.files.map((f: any) => `/uploads/${f.filename}`)) : '[]';

  try {
    const { data, error } = await supabase
      .from('visits')
      .insert({
        kiosk_id, 
        user_id, 
        visit_date, 
        visit_time, 
        photos, 
        visit_type_id, 
        problem_type_id: problem_type_id || null, 
        description
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ message: 'Visit recorded successfully', id: data.id });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
});

router.get('/report', async (req: any, res) => {
  const { start_date, end_date, kiosk_number } = req.query;
  
  let query = supabase
    .from('visits')
    .select(`
      *,
      kiosks!inner (kiosk_number, address),
      users (username),
      visit_types (name),
      problem_types (name)
    `);

  if (start_date) query = query.gte('visit_date', start_date);
  if (end_date) query = query.lte('visit_date', end_date);
  
  if (kiosk_number) {
    query = query.ilike('kiosks.kiosk_number', `%${kiosk_number}%`);
  }

  query = query.order('visit_date', { ascending: false }).order('visit_time', { ascending: false });

  try {
    const { data: visits, error } = await query;

    if (error) throw error;

    // Flatten the response
    const formattedVisits = visits.map((v: any) => ({
      ...v,
      kiosk_number: v.kiosks?.kiosk_number,
      address: v.kiosks?.address,
      username: v.users?.username,
      visit_type_name: v.visit_types?.name,
      problem_type_name: v.problem_types?.name
    }));

    res.json(formattedVisits);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, upload.array('photos', 2), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  const { id } = req.params;
  const { kiosk_id, visit_date, visit_time, visit_type_id, problem_type_id, description } = req.body;
  
  let photos = null;
  if (req.files && req.files.length > 0) {
    photos = JSON.stringify(req.files.map((f: any) => `/uploads/${f.filename}`));
  }

  try {
    const updates: any = {
      kiosk_id, 
      visit_date, 
      visit_time, 
      visit_type_id, 
      problem_type_id: problem_type_id || null, 
      description
    };
    
    if (photos) {
      updates.photos = photos;
    }

    const { error } = await supabase
      .from('visits')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Visit updated successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('visits')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Visit deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/my-visits', async (req: any, res) => {
  const user_id = req.user.id;
  try {
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        *,
        kiosks (kiosk_number),
        visit_types (name),
        problem_types (name)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedVisits = visits.map((v: any) => ({
      ...v,
      kiosk_number: v.kiosks?.kiosk_number,
      visit_type_name: v.visit_types?.name,
      problem_type_name: v.problem_types?.name
    }));

    res.json(formattedVisits);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
