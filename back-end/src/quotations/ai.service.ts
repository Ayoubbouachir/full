import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  async scanQuotationImage(file: Express.Multer.File): Promise<any> {
    console.log(`🏁 [AI SERVICE] v4.0 - Processing ${file.originalname}`);

    const keys: string[] = [
      this.configService.get<string>('GEMINI_API_KEY_2'),
      this.configService.get<string>('GEMINI_API_KEY'),
    ].filter((k): k is string => !!k && k.startsWith('AIza'));

    for (const key of keys) {
      try {
        // We use the successful discovery pattern
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const listRes = await fetch(listUrl);
        const listData = await listRes.json();
        const modelNames =
          listData.models?.map((m) => m.name.replace('models/', '')) || [];

        // Try the best flash/pro models found in the list
        const preferredModels = modelNames.filter(
          (m) => m.includes('flash') || m.includes('pro'),
        );

        for (const modelName of preferredModels) {
          try {
            console.log(
              `📡 [AI SERVICE] Extracting data using ${modelName}...`,
            );
            return await this.executeGeminiCall(file, key, modelName, 'v1beta');
          } catch (e) {
            if (e.message.includes('429')) continue; // Try next if quota hit
            console.warn(
              `⚠️ [AI SERVICE] ${modelName} skip: ${e.message.substring(0, 30)}`,
            );
          }
        }
      } catch (e) {
        console.error(`❌ [AI SERVICE] Key error: ${e.message}`);
      }
    }

    return await this.tryOpenAiFallback(file);
  }

  private async executeGeminiCall(
    file: Express.Multer.File,
    apiKey: string,
    model: string,
    version: string,
  ) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.mimetype,
                  data: file.buffer.toString('base64'),
                },
              },
              {
                text: 'Analyze this quotation image and return ONLY a JSON object with this exact structure: { "title": "string", "description": "string", "price": number, "estimatedTime": "string", "items": [{ "item": "string", "qty": number, "unitPrice": number, "total": number }] }. Calculate the total for each item and the grand price. Estimate a realistic work duration (e.g., \'3 days\') for the estimatedTime field.',
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || 'API Error');

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text');

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  }

  private async tryOpenAiFallback(file: Express.Multer.File) {
    const openAiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!openAiKey)
      throw new Error('Could not process image with any AI service.');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Return quotation JSON with title, total, items, and estimatedWorkDuration.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
                },
              },
            ],
          },
        ],
      }),
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]);
  }
}
