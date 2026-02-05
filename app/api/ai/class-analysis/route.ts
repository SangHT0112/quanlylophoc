import { NextResponse } from 'next/server';

// URL API Gemini (sử dụng gemini-1.5-flash để ổn định và rẻ hơn, có thể đổi sang 2.5 nếu cần)
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";


const geminiKeys: string[] = [];
let i = 1;
while (process.env[`GEMINI_API_KEY_${i}`]) {
  geminiKeys.push(process.env[`GEMINI_API_KEY_${i}`]!);
  i++;
}
if (geminiKeys.length === 0 && process.env.GEMINI_API_KEY) {
  geminiKeys.push(process.env.GEMINI_API_KEY);
}
if (geminiKeys.length === 0) {
  throw new Error("No Gemini API key configured in environment variables");
}

console.log(`Đã load ${geminiKeys.length} Gemini API keys`);

// Set theo dõi key bị tạm khóa do 429 (quota hết)
const exhaustedKeys = new Set<number>(); // lưu index của key
const EXHAUST_COOLDOWN_MS = 5 * 60 * 1000; // 5 phút cooldown

// Biến round-robin
let currentKeyIndex = 0;

function getNextAvailableKey(): { key: string; index: number } | null {
  const start = currentKeyIndex;
  let attempts = 0;

  while (attempts < geminiKeys.length) {
    const idx = currentKeyIndex % geminiKeys.length;
    currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;

    if (!exhaustedKeys.has(idx)) {
      return { key: geminiKeys[idx], index: idx };
    }
    attempts++;
  }
  return null; // Tất cả key đều bị khóa tạm thời
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const timeFilter = searchParams.get('timeFilter') || 'today';
    const showAll = searchParams.get('showAll') === 'true';
    const subjectCode = searchParams.get('subjectCode') || '';
    const customDate = searchParams.get('date');

    if (!classId) {
      return NextResponse.json({ success: false, error: 'Thiếu classId' }, { status: 400 });
    }

    // Gọi API stats
    const statsUrl = new URL(`/api/stats/class/${classId}`, request.url);
    statsUrl.searchParams.set('timeFilter', timeFilter);
    statsUrl.searchParams.set('showAll', showAll.toString());
    if (subjectCode) statsUrl.searchParams.set('subjectId', subjectCode);
    if (customDate) statsUrl.searchParams.set('date', customDate);

    const statsRes = await fetch(statsUrl.toString(), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!statsRes.ok) {
      throw new Error(`Không lấy được dữ liệu thống kê: ${statsRes.status}`);
    }

    const statsData = await statsRes.json();

    if (!statsData.success || !statsData.students?.length) {
      return NextResponse.json({
        success: true,
        analysis: 'Hiện tại chưa có đủ dữ liệu để em phân tích cho lớp ạ.',
      });
    }

    // Nhãn thời gian
    const periodLabelMap: Record<string, string> = {
      today: 'hôm nay',
      week: 'tuần này',
      month: 'tháng này',
      all: 'toàn bộ thời gian',
      custom: customDate ? `ngày ${customDate}` : 'khoảng thời gian đã chọn',
    };
    const periodLabel = periodLabelMap[timeFilter] || 'khoảng thời gian này';

    const subjectLabel = showAll ? 'tất cả các môn' : `môn ${subjectCode.toUpperCase()}`;

    // Tạo summaryText
    let summaryText = `
Lớp: ${statsData.class.className} (${statsData.class.totalStudents} học sinh)
Thời gian: ${periodLabel}
Môn: ${subjectLabel}
${statsData.absentToday !== undefined ? `Vắng hôm nay: ${statsData.absentToday} em` : ''}

Top 5 bạn tích cực phát biểu nhất:
${statsData.students
  .sort((a: any, b: any) => (b.participation_count || 0) - (a.participation_count || 0))
  .slice(0, 5)
  .map((s: any) => `- ${s.name}: ${s.participation_count || 0} lượt`)
  .join('\n')}

Top 5 bạn có nhiều điểm miệng nhất (số lượt hoặc điểm cao):
${statsData.students
  .filter((s: any) => s.subject_scores)
  .sort((a: any, b: any) => {
    const countA = (a.subject_scores?.split(', ')?.length || 0);
    const countB = (b.subject_scores?.split(', ')?.length || 0);
    return countB - countA;
  })
  .slice(0, 5)
  .map((s: any) => `- ${s.name}: ${s.subject_scores}`)
  .join('\n')}

Số bạn đã vắng ít nhất 1 lần: ${statsData.students.filter((s: any) => (s.total_absent || 0) > 0).length} bạn
`.trim();

    // Bổ sung phần điểm thấp ≤5.0
    const lowScoreStudents = statsData.students
      .filter((s: any) => {
        if (!s.subject_scores) return false;
        const scores = s.subject_scores
          .split(', ')
          .map((item: string) => {
            const match = item.match(/(\d+\.?\d*)/);
            return match ? parseFloat(match[1]) : NaN;
          })
          .filter((n: number) => !isNaN(n));
        return scores.some((score: number) => score <= 5.0);
      })
      .map((s: any) => {
        const lowScores = s.subject_scores
          .split(', ')
          .filter((item: string) => {
            const match = item.match(/(\d+\.?\d*)/);
            return match && parseFloat(match[1]) <= 5.0;
          });
        return `- ${s.name}: ${lowScores.join(', ')}`;
      })
      .slice(0, 5);

    const lowScoreText = lowScoreStudents.length > 0
      ? `\n\nCác bạn có điểm miệng thấp (≤5.0) cần được cô động viên và hỗ trợ thêm:\n${lowScoreStudents.join('\n')}`
      : `\n\nHiện tại không có bạn nào có điểm miệng ≤5.0 trong khoảng thời gian này ạ. Lớp mình đang rất ổn!`;

    summaryText += lowScoreText;

    // Prompt cho trợ lý AI
    const prompt = `
Bạn là trợ lý thông minh, tận tâm hỗ trợ cô giáo chủ nhiệm quản lý lớp học.  
Giọng điệu nhẹ nhàng, gần gũi, lịch sự, luôn tích cực và khích lệ.  
Bạn xưng "em" khi nói với cô/thầy, và khi nói về lớp thì dùng cách nói thân thiện như "các bạn", "lớp mình".

Nhiệm vụ: Dựa vào dữ liệu thống kê dưới đây, viết một đoạn nhận xét ngắn gọn (khoảng 200-350 từ) bằng tiếng Việt tự nhiên, liền mạch, tập trung vào:

- Khen ngợi các bạn phát biểu tích cực nhất và có điểm miệng nổi bật ${periodLabel} (nêu tên 3-5 bạn nếu có, khen trước tiên).
- Nhận xét chung về lớp (nói điểm tích cực trước: không khí học tập, sự tiến bộ, tinh thần lớp...).
- Nhẹ nhàng đề cập đến các bạn cần hỗ trợ thêm (nếu có bạn điểm miệng ≤5.0 hoặc ít phát biểu, chỉ đề cập nếu dữ liệu có; nói rất dịu dàng, mang tính xây dựng như "Em thấy một số bạn còn điểm hơi thấp, có lẽ do chưa tự tin lắm, cô có thể khích lệ thêm ạ").
- Kết thúc bằng lời động viên ấm áp cho cả lớp (ví dụ: "Em tin rằng với sự cố gắng của các bạn và sự hướng dẫn tận tình của cô, lớp mình sẽ ngày càng tiến bộ hơn nữa ạ!").

Quan trọng:
- Chỉ đề cập điểm thấp nếu dữ liệu thực sự có (không bịa).
- Không chê bai, không dùng từ tiêu cực mạnh; luôn khích lệ và gợi ý cô động viên riêng.
- Viết liền mạch như lời báo cáo thân thiện, không dùng dấu đầu dòng.

Dữ liệu thống kê:
${summaryText}
`.trim();

    // Gọi Gemini với round-robin + xử lý 429
    const maxRetries = geminiKeys.length * 3; // tối đa 3 vòng qua tất cả key
    let retryCount = 0;
    let analysisText = '';

    while (retryCount < maxRetries) {
      const keyInfo = getNextAvailableKey();

      if (!keyInfo) {
        console.warn('Tất cả key Gemini tạm thời hết quota. Chờ cooldown...');
        // Có thể await một khoảng thời gian ngắn nếu muốn retry sau, nhưng ở đây throw để trả lỗi cho client
        throw new Error('Tất cả key Gemini API tạm thời hết quota. Thử lại sau 5-10 phút.');
      }

      const { key, index } = keyInfo;

      try {
        console.log(`Đang thử key ${index + 1}/${geminiKeys.length}...`);

        const generateRes = await fetch(`${GEMINI_API_URL}?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 12000,
              topP: 0.9,
            },
          }),
        });

        if (!generateRes.ok) {
          const errData = await generateRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || generateRes.statusText;

          if (generateRes.status === 429 || errMsg.toLowerCase().includes('resource_exhausted') || errMsg.toLowerCase().includes('quota')) {
            exhaustedKeys.add(index);
            console.warn(`Key ${index + 1} bị 429 (hết quota) → tạm khóa ${EXHAUST_COOLDOWN_MS / 60000} phút`);

            setTimeout(() => {
              exhaustedKeys.delete(index);
              console.log(`Key ${index + 1} đã hết cooldown, sẵn sàng sử dụng lại`);
            }, EXHAUST_COOLDOWN_MS);

            retryCount++;
            continue;
          }

          throw new Error(`Gemini API lỗi: ${generateRes.status} - ${errMsg}`);
        }

        const geminiData = await generateRes.json();
        analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        console.log(`Thành công với key ${index + 1}`);
        break;

      } catch (fetchErr: any) {
        console.error(`Lỗi fetch với key ${index + 1}:`, fetchErr.message);
        retryCount++;
      }
    }

    if (!analysisText) {
      analysisText = 'Em chưa tổng hợp được nhận xét chi tiết do hết quota API hoặc lỗi kết nối ạ. Cô thử lại sau chút nữa nhé!';
    }

    return NextResponse.json({
      success: true,
      analysis: analysisText,
    });
  } catch (err: any) {
    console.error('Lỗi tổng thể khi phân tích AI:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Hiện tại em chưa thể phân tích được ạ. Cô thử lại sau chút nữa nhé!',
        devMessage: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}