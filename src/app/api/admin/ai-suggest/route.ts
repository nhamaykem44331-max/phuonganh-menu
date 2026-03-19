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

    // BƯỚC 1: Gọi Gemini API sinh text
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Bạn là chuyên gia ẩm thực Việt Nam.
Tên món ăn: "${name}"

Hãy trả về JSON hợp lệ (chỉ trả về JSON theo đúng định dạng sau):
{
  "nameEn": "tên món bằng tiếng Anh, ngắn gọn",
  "description": "mô tả hấp dẫn bằng tiếng Việt, 1-2 câu, nêu nguyên liệu chính và cách chế biến đặc trưng",
  "descriptionEn": "same description in English, 1-2 sentences",
  "imageKeyword": "3-5 từ tiếng Anh mô tả món ăn để tìm ảnh, ví dụ: grilled-chicken-honey-vietnamese"
}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
          }
        }),
      }
    );

    const geminiData = await geminiRes.json();
    
    if (!geminiRes.ok) {
       console.error("Gemini API Error:", geminiData);
       throw new Error(geminiData?.error?.message || "Lỗi khi gọi Gemini API");
    }

    let rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    
    // Xoá markdown wrapper nếu Gemini vẫn trả về
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
