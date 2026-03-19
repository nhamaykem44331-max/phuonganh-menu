import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên món" }, 
        { status: 400 }
      );
    }

    // BƯỚC 1: Gọi Claude API sinh text
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Đổi sang Haiku cho nhẹ, nhanh và tránh lỗi giới hạn Opus
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Bạn là chuyên gia ẩm thực Việt Nam.
Tên món ăn: "${name}"

Hãy trả về JSON hợp lệ (không có text thừa, không markdown, chỉ trả về code json trực tiếp và duy nhất):
{
  "nameEn": "tên món bằng tiếng Anh, ngắn gọn",
  "description": "mô tả hấp dẫn bằng tiếng Việt, 1-2 câu, nêu nguyên liệu chính và cách chế biến đặc trưng",
  "descriptionEn": "same description in English, 1-2 sentences",
  "imageKeyword": "3-5 từ tiếng Anh mô tả món ăn để tìm ảnh, ví dụ: grilled-chicken-honey-vietnamese"
}`
          }
        ]
      }),
    });

    const claudeData = await claudeRes.json();
    
    if (!claudeRes.ok) {
       console.error("Claude API Error:", claudeData);
       throw new Error(claudeData?.error?.message || "Lỗi khi gọi Claude API");
    }

    let rawText = claudeData.content?.[0]?.text ?? "{}";
    
    // Xoá markdown wrapper nếu Claude vẫn trả về
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let aiResult: {
      nameEn: string;
      description: string;
      descriptionEn: string;
      imageKeyword: string;
    };
    
    try {
      aiResult = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Lỗi parse JSON:", parseError, rawText);
      // Fallback nếu parse lỗi
      aiResult = {
        nameEn: "",
        description: "",
        descriptionEn: "",
        imageKeyword: name.toLowerCase().replace(/\s+/g, "-"),
      };
    }

    // BƯỚC 2: Tạo URL ảnh từ Pollinations.ai
    const keyword = aiResult.imageKeyword || 
      name.toLowerCase().replace(/\s+/g, "-");
    
    const imagePrompt = encodeURIComponent(
      `${keyword} vietnamese fine dining food photography ` +
      `dark background elegant plating professional restaurant`
    );
    
    const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}` +
      `?width=800&height=600&nologo=true&enhance=true&model=flux`;

    return NextResponse.json({
      success: true,
      data: {
        nameEn: aiResult.nameEn || "",
        description: aiResult.description || "",
        descriptionEn: aiResult.descriptionEn || "",
        imageUrl,
      },
    });

  } catch (error) {
    console.error("[AI Suggest]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Lỗi AI, vui lòng thử lại" },
      { status: 500 }
    );
  }
}
