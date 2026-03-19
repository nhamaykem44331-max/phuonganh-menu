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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    // BƯỚC 2: Tạo URL ảnh từ Leonardo.ai
    const keyword = aiResult.imageKeyword || name.toLowerCase().replace(/\s+/g, "-");
    const imagePrompt = `${keyword} vietnamese fine dining food photography, dark background, elegant plating, professional restaurant, high resolution 8k.`;
    
    let imageUrl = "";
    const leoApiKey = process.env.LEONARDO_API_KEY;

    if (leoApiKey) {
      try {
        // Yêu cầu tạo ảnh
        const leoCreateRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${leoApiKey}`,
            "accept": "application/json"
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            num_images: 1,
            width: 832,
            height: 576,
            promptMagic: true // Tăng cường độ chi tiết ảnh
          })
        });

        const leoCreateData = await leoCreateRes.json();
        const generationId = leoCreateData?.sdGenerationJob?.generationId;

        if (generationId) {
          // Polling kết quả (Tối đa 5 lần = 15s)
          for (let i = 0; i < 5; i++) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            const leoGetRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
              headers: {
                "Authorization": `Bearer ${leoApiKey}`,
                "accept": "application/json"
              }
            });
            const leoGetData = await leoGetRes.json();
            const images = leoGetData?.generations_by_pk?.generated_images;
            
            if (images && images.length > 0) {
              imageUrl = images[0].url;
              break;
            }
          }
        }
      } catch (err) {
        console.error("Leonardo API Error:", err);
      }
    }

    // Nếu Leonardo thất bại (hoặc chưa setup API key), dùng lại Pollinations.ai tạm thời
    if (!imageUrl) {
      const fallbackPrompt = encodeURIComponent(imagePrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=800&height=600&nologo=true&enhance=true&model=flux`;
    }

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
