import express from 'express';
import { supabase } from '../db/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/admin', async (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    // Total Kiosks
    const { count: totalKiosks, error: err1 } = await supabase
      .from('kiosks')
      .select('*', { count: 'exact', head: true });
    
    if (err1) throw err1;

    // Visited this month (distinct kiosks)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const { data: visitsThisMonth, error: err2 } = await supabase
      .from('visits')
      .select('kiosk_id')
      .gte('visit_date', startOfMonth);

    if (err2) throw err2;

    const uniqueKiosksVisited = new Set(visitsThisMonth?.map((v: any) => v.kiosk_id)).size;
    const notVisited = (totalKiosks || 0) - uniqueKiosksVisited;

    // Daily visits for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: visitsLast30Days, error: err3 } = await supabase
      .from('visits')
      .select('visit_date')
      .gte('visit_date', thirtyDaysAgoStr);

    if (err3) throw err3;

    const dailyVisitsMap: Record<string, number> = {};
    visitsLast30Days?.forEach((v: any) => {
      dailyVisitsMap[v.visit_date] = (dailyVisitsMap[v.visit_date] || 0) + 1;
    });

    const dailyVisits = Object.entries(dailyVisitsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalKiosks: totalKiosks || 0,
      visitedThisMonth: uniqueKiosksVisited,
      notVisited,
      dailyVisits
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/user', async (req: any, res) => {
  const userId = req.user.id;
  const username = req.user.username;

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Visited Today
    const { count: visitedToday, error: err1 } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('visit_date', today);

    if (err1) throw err1;

    // Visited This Month
    const { count: visitedThisMonth, error: err2 } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('visit_date', startOfMonth);

    if (err2) throw err2;

    // Awaiting visit
    // 1. Get all kiosks assigned to supervisor
    const { data: myKiosks, error: err3 } = await supabase
      .from('kiosks')
      .select('id')
      .eq('supervisor', username);

    if (err3) throw err3;

    // 2. Get all visits by user this month
    const { data: myVisitsThisMonth, error: err4 } = await supabase
      .from('visits')
      .select('kiosk_id')
      .eq('user_id', userId)
      .gte('visit_date', startOfMonth);

    if (err4) throw err4;

    const visitedKioskIds = new Set(myVisitsThisMonth?.map((v: any) => v.kiosk_id));
    const awaitingVisit = myKiosks?.filter((k: any) => !visitedKioskIds.has(k.id)).length || 0;

    // Daily visits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: visitsLast30Days, error: err5 } = await supabase
      .from('visits')
      .select('visit_date')
      .eq('user_id', userId)
      .gte('visit_date', thirtyDaysAgoStr);

    if (err5) throw err5;

    const dailyVisitsMap: Record<string, number> = {};
    visitsLast30Days?.forEach((v: any) => {
      dailyVisitsMap[v.visit_date] = (dailyVisitsMap[v.visit_date] || 0) + 1;
    });

    const dailyVisits = Object.entries(dailyVisitsMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      visitedToday: visitedToday || 0,
      visitedThisMonth: visitedThisMonth || 0,
      awaitingVisit,
      dailyVisits
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
