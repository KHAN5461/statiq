import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', success: false });
  }

  try {
    const { user_parichay_id, courses } = req.query;
    if (!user_parichay_id || !courses) {
      return res.status(400).json({ error: "Missing user_parichay_id or courses query parameters", success: false });
    }
    
    const courseList = typeof courses === 'string' ? courses.split(',') : [];
    
    // Generate mock progress for the requested courses for demonstration
    const progress: Record<string, any> = {};
    courseList.forEach(courseId => {
      // Create a deterministic pseudo-random progress based on user and course string
      const hash = String(user_parichay_id + courseId).split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
      const percentage = Math.abs(hash % 101); // 0 to 100
      let status = 'In Progress';
      if (percentage === 0) status = 'Not Started';
      if (percentage === 100) status = 'Completed';
      
      progress[courseId] = {
        courseId,
        completionPercentage: percentage,
        status,
        lastAccessed: new Date(Date.now() - Math.abs(hash % 10000) * 60000).toISOString() // Random recent date
      };
    });

    return res.status(200).json({
      status: "success",
      progress
    });
  } catch (error: any) {
    console.error("Failed to fetch progress", error);
    return res.status(500).json({ error: error.message || "Failed to fetch progress", success: false });
  }
}
