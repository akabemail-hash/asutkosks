import express from 'express';
import { supabase } from '../db/supabase';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/geocode', async (req: any, res: any) => {
  const { address, kiosk_id } = req.query;
  if (!address) return res.status(400).json({ message: 'Address required' });

  try {
    // Call Nominatim with proper User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address as string)}`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'KioskManagementApp/1.0' 
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // Update kiosk if ID provided
      if (kiosk_id) {
        const { error } = await supabase
          .from('kiosks')
          .update({ latitude: lat, longitude: lon })
          .eq('id', kiosk_id);
        
        if (error) throw error;
      }

      return res.json({ lat, lon });
    }
    
    res.status(404).json({ message: 'Address not found' });
  } catch (err: any) {
    console.error('Geocoding error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req: any, res) => {
  const { page = 1, limit = 10, kiosk_number, address, supervisor, mobile_number, shelf, is_active } = req.query;
  
  let query = supabase.from('kiosks').select('*', { count: 'exact' });

  if (kiosk_number) query = query.ilike('kiosk_number', `%${kiosk_number}%`);
  if (address) query = query.ilike('address', `%${address}%`);
  if (supervisor) query = query.ilike('supervisor', `%${supervisor}%`);
  if (mobile_number) query = query.ilike('mobile_number', `%${mobile_number}%`);
  if (shelf) query = query.ilike('shelf', `%${shelf}%`);
  if (is_active !== undefined && is_active !== '') {
    query = query.eq('is_active', is_active === 'true' || is_active === '1' ? 1 : 0);
  }

  // Pagination
  if (limit !== '0' && limit !== 'all') {
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    query = query.range(from, to);
  }

  query = query.order('created_at', { ascending: false });

  try {
    const { data: kiosks, count, error } = await query;

    if (error) throw error;

    const total = count || 0;

    res.json({
      data: kiosks,
      pagination: {
        total,
        page: Number(page),
        limit: limit === '0' || limit === 'all' ? total : Number(limit),
        totalPages: limit === '0' || limit === 'all' ? 1 : Math.ceil(total / Number(limit))
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import', async (req: any, res) => {
  const kiosks = req.body;
  
  if (!Array.isArray(kiosks)) {
    return res.status(400).json({ message: 'Input must be an array of kiosks' });
  }

  try {
    const formattedKiosks = kiosks.map((k: any) => ({
      kiosk_number: k.kiosk_number,
      supervisor: k.supervisor || null,
      mobile_number: k.mobile_number || null,
      address: k.address || null,
      shelf: k.shelf || null,
      is_active: k.is_active !== undefined ? (k.is_active ? 1 : 0) : 1,
      latitude: k.latitude || null,
      longitude: k.longitude || null
    }));

    const { data, error } = await supabase
      .from('kiosks')
      .upsert(formattedKiosks, { onConflict: 'kiosk_number', ignoreDuplicates: true })
      .select();

    if (error) throw error;

    res.json({ message: `Imported successfully.` });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.post('/', async (req: any, res) => {
  const { kiosk_number, supervisor, mobile_number, address, shelf, is_active, latitude, longitude } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('kiosks')
      .insert({
        kiosk_number, 
        supervisor, 
        mobile_number, 
        address, 
        shelf, 
        is_active: is_active ? 1 : 0, 
        latitude, 
        longitude
      })
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', async (req: any, res) => {
  const { kiosk_number, supervisor, mobile_number, address, shelf, is_active, latitude, longitude } = req.body;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('kiosks')
      .update({
        kiosk_number, 
        supervisor, 
        mobile_number, 
        address, 
        shelf, 
        is_active: is_active ? 1 : 0, 
        latitude, 
        longitude
      })
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Kiosk updated' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/all', async (req: any, res) => {
  console.log('Deleting all kiosks...');
  try {
    const { error } = await supabase
      .from('kiosks')
      .delete()
      .neq('id', 0); // Delete all rows (id is never 0 usually, or use a condition that matches all)
      // Actually, Supabase delete requires a WHERE clause. .neq('id', 0) is a hack to delete all if IDs are positive.
      // Or better: .gt('id', -1)

    if (error) throw error;

    console.log('All kiosks deleted successfully');
    res.json({ message: 'All kiosks deleted' });
  } catch (err: any) {
    console.error('Error deleting all kiosks:', err);
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  const { id } = req.params;
  console.log(`Deleting kiosk with id: ${id}`);
  try {
    const { error } = await supabase
      .from('kiosks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Kiosk deleted' });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
