import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mezcsiaozymspbroflye.supabase.co',
  'sb_publishable_Rzq-U1RYiZTiTX6IbFNnFA_xOT6_3ba'
);

async function run() {
  const wb = XLSX.readFile('Data-web-share.xlsx');
  console.log('Sheets in Excel:', wb.SheetNames);

  // 1. Sheet WebHub_Projects
  const projectsSheet = wb.Sheets['WebHub_Projects'];
  if (projectsSheet) {
    const rawData = XLSX.utils.sheet_to_json(projectsSheet);
    console.log('Raw projects count:', rawData.length);
    console.log('Sample raw row keys:', Object.keys(rawData[0] || {}));

    const rows = rawData.map((r) => {
      // Parse tags
      let tags = [];
      if (r['Tags'] || r['tags']) {
        const tStr = String(r['Tags'] || r['tags']);
        tags = tStr.split(',').map(s => s.trim()).filter(Boolean);
      }

      return {
        id: String(r['ID'] || r['id'] || 'proj-' + Date.now()),
        title: String(r['Title'] || r['title'] || r['Tiêu đề'] || ''),
        url: String(r['URL'] || r['url'] || ''),
        description: String(r['Description'] || r['description'] || r['Mô tả'] || ''),
        country: String(r['Country'] || r['country'] || 'VN'),
        category: String(r['Category'] || r['category'] || 'general').toLowerCase(),
        education_level: String(r['EducationLevel'] || r['education_level'] || r['Cấp học'] || 'all'),
        status: 'approved',
        is_famous: false,
        author_name: String(r['AuthorName'] || r['author_name'] || r['Tác giả'] || 'Thành viên'),
        author_contact: String(r['AuthorContact'] || r['author_contact'] || ''),
        created_at: r['CreatedAt'] || r['created_at'] || new Date().toISOString(),
        preview_image: String(r['PreviewImage'] || r['preview_image'] || r['Ảnh'] || ''),
        preview_image_history: [],
        tags: tags,
        views: Number(r['Views'] || r['views'] || 0),
        likes: Number(r['Likes'] || r['likes'] || 0),
        is_user_submission: true,
        go_link: String(r['GoLink'] || r['go_link'] || ''),
      };
    }).filter(p => p.title && p.url);

    console.log('Processed valid projects to insert into webhub:', rows.length);
    console.log('Titles:', rows.map(r => r.title));

    // Delete temp seed if exists
    await supabase.from('webhub').delete().eq('id', 'proj-seed-1');

    const { error } = await supabase.from('webhub').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('Error inserting into webhub:', error);
    } else {
      console.log('Successfully inserted into webhub!');
    }
  }

  // 2. Sheet WebHub_Submissions (nếu có)
  const subsSheet = wb.Sheets['WebHub_Submissions'];
  if (subsSheet) {
    const rawSubs = XLSX.utils.sheet_to_json(subsSheet);
    console.log('Raw submissions count:', rawSubs.length);
    if (rawSubs.length > 0) {
      const subRows = rawSubs.map((r) => {
        let tags = [];
        if (r['Tags'] || r['tags']) {
          const tStr = String(r['Tags'] || r['tags']);
          tags = tStr.split(',').map(s => s.trim()).filter(Boolean);
        }
        return {
          id: String(r['ID'] || r['id'] || 'sub-' + Date.now()),
          title: String(r['Title'] || r['title'] || ''),
          url: String(r['URL'] || r['url'] || ''),
          description: String(r['Description'] || r['description'] || ''),
          country: String(r['Country'] || r['country'] || 'VN'),
          category: String(r['Category'] || r['category'] || 'general').toLowerCase(),
          education_level: String(r['EducationLevel'] || r['education_level'] || 'all'),
          status: 'pending',
          is_famous: false,
          author_name: String(r['AuthorName'] || r['author_name'] || 'Thành viên'),
          author_contact: String(r['AuthorContact'] || r['author_contact'] || ''),
          created_at: r['CreatedAt'] || r['created_at'] || new Date().toISOString(),
          preview_image: String(r['PreviewImage'] || r['preview_image'] || ''),
          preview_image_history: [],
          tags: tags,
          go_link: String(r['GoLink'] || r['go_link'] || ''),
        };
      }).filter(p => p.title && p.url);

      const { error: subErr } = await supabase.from('submissions').upsert(subRows, { onConflict: 'id' });
      if (subErr) {
        console.error('Error inserting into submissions:', subErr);
      } else {
        console.log('Successfully inserted into submissions:', subRows.length);
      }
    }
  }

  // Check final counts
  const { data: wCheck } = await supabase.from('webhub').select('id, title');
  console.log('FINAL webhub count in Supabase:', wCheck?.length);
  const { data: sCheck } = await supabase.from('submissions').select('id, title');
  console.log('FINAL submissions count in Supabase:', sCheck?.length);
}

run();
