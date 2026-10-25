import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mezcsiaozymspbroflye.supabase.co',
  'sb_publishable_Rzq-U1RYiZTiTX6IbFNnFA_xOT6_3ba'
);

async function testSubmissions() {
  const testId = 'test-sub-' + Date.now();
  console.log('1. Bắt đầu gửi bài test vào submissions với id:', testId);

  const testItem = {
    id: testId,
    title: 'Mô phỏng Thử Nghiệm Kiểm Tra Supabase Submissions',
    url: 'https://test-submission.vercel.app/',
    description: 'Bài kiểm tra tự động kết nối bảng submissions trên Supabase',
    country: 'VN',
    category: 'physics',
    education_level: 'high_school',
    status: 'pending',
    is_famous: false,
    author_name: 'Hệ Thống Kiểm Thử',
    author_contact: 'test@pmca.edu.vn',
    created_at: new Date().toISOString(),
    preview_image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=800',
    tags: ['Test', 'Supabase', 'Submissions'],
    go_link: 'test-submission',
  };

  // Bước 1: Ghi vào submissions
  const { error: insertErr } = await supabase.from('submissions').insert([testItem]);

  if (insertErr) {
    console.error('LỖI GHI VÀO SUBMISSIONS:', insertErr);
    return;
  }
  console.log('-> GHI THÀNH CÔNG VÀO BẢNG SUBMISSIONS!');

  // Bước 2: Dọn dẹp bản ghi test
  const { error: delErr } = await supabase.from('submissions').delete().eq('id', testId);
  if (!delErr) {
    console.log('-> DỌN DẸP BẢN GHI TEST THÀNH CÔNG!');
  }
}

testSubmissions();
