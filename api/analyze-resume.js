// CORS ヘッダーを設定する関数
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// JSONレスポンスを安全に解析する関数
function extractJSON(text) {
    // マークダウンのコードブロックを除去
    let cleanText = text.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim();
    
    // JSON部分を抽出
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        cleanText = jsonMatch[0];
    }
    
    try {
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('JSON parsing error:', error);
        console.error('Attempted to parse:', cleanText);
        throw new Error('分析結果の解析に失敗しました');
    }
}

export default async function handler(req, res) {
    console.log('=== Resume Analysis API Called ===');
    
    // CORS設定
    setCorsHeaders(res);
    
    // OPTIONS リクエストの処理
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    // POST メソッドのみ許可
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        console.log('Request method:', req.method);
        console.log('Request body exists:', !!req.body);
        
        const { resumeText } = req.body;
        
        if (!resumeText || typeof resumeText !== 'string') {
            console.log('Invalid resumeText:', { hasResumeText: !!resumeText, type: typeof resumeText });
            res.status(400).json({ error: '履歴書・職務経歴書のテキストが必要です' });
            return;
        }
        
        console.log('Resume text length:', resumeText.length);
        
        // Gemini API key のチェック
        const apiKey = process.env.GEMINI_API_KEY;
        console.log('API key exists:', !!apiKey);
        console.log('API key length:', apiKey ? apiKey.length : 0);
        
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set in environment variables');
            res.status(500).json({ 
                error: 'API key not configured',
                details: 'GEMINI_API_KEY environment variable is missing'
            });
            return;
        }
        
        const model = 'gemini-2.0-flash';
        
        // 履歴書分析用プロンプト
        const prompt = `
以下の履歴書・職務経歴書の内容を分析し、社会的能力を6つの分野で評価してください。
各分野を1-5の数値で評価し、詳細な分析結果も含めてください。

【履歴書・職務経歴書内容】
${resumeText}

以下のJSON形式で正確に応答してください（他の文章は含めず、JSONのみ）：

{
    "socialScores": {
        "communication": [1-5の数値],
        "leadership": [1-5の数値],
        "adaptability": [1-5の数値],
        "selfManagement": [1-5の数値],
        "empathy": [1-5の数値],
        "mental": [1-5の数値]
    },
    "socialAnalysis": "社会的能力に関する詳細な分析文章（300文字程度）",
    "careerSummary": "経歴の要約と特徴（200文字程度）"
}

【評価基準】
- communication (コミュニケーション): 職歴での人との関わり、プレゼン経験、チームワーク等
- leadership (リーダーシップ): 管理職経験、チームリード、プロジェクト管理等
- adaptability (学習・適応力): 転職、新技術習得、資格取得、環境変化への対応等
- selfManagement (セルフマネジメント): 継続的なキャリア構築、目標達成、時間管理等
- empathy (対人理解・共感力): 顧客対応、サービス業経験、教育・指導経験等
- mental (メンタル): 困難な状況での継続、挑戦的な取り組み、ストレス耐性等

※経歴の長さ、職種、実績を総合的に判断し、現実的な評価をしてください。
※分析文章は具体的な経歴に基づいた説得力のある内容にしてください。
`;
        
        console.log('Sending resume analysis request to Gemini API...');
        console.log('Prompt length:', prompt.length);
        
        // Gemini API リクエスト（REST API形式）
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        console.log('Gemini API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            
            let errorMessage = 'AI API呼び出しに失敗しました';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                // JSON解析に失敗した場合はそのまま
            }
            
            res.status(502).json({ 
                error: errorMessage,
                details: errorText.substring(0, 500)
            });
            return;
        }

        const data = await response.json();
        console.log('Gemini API call completed');
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid API response structure:', data);
            res.status(502).json({ 
                error: 'AIからの応答が不正です',
                details: 'No valid content in response'
            });
            return;
        }

        let responseText = data.candidates[0].content.parts[0].text;
        console.log('Response text length:', responseText.length);
        console.log('Raw Gemini API response:', responseText.substring(0, 500) + '...');
        
        // JSONを抽出・解析
        let analysis;
        try {
            analysis = extractJSON(responseText);
            console.log('JSON extraction successful');
        } catch (jsonError) {
            console.error('JSON extraction failed:', jsonError);
            res.status(502).json({ 
                error: '分析結果の解析に失敗しました',
                details: jsonError.message,
                rawResponse: responseText.substring(0, 1000)
            });
            return;
        }
        
        // 必須フィールドの検証
        const requiredFields = ['socialScores', 'socialAnalysis'];
        for (const field of requiredFields) {
            if (!(field in analysis)) {
                console.error(`Missing required field: ${field}`);
                res.status(502).json({ 
                    error: '分析結果の形式が正しくありません',
                    details: `Missing required field: ${field}`,
                    analysis: analysis
                });
                return;
            }
        }
        
        // socialScoresの検証
        const requiredScores = ['communication', 'leadership', 'adaptability', 'selfManagement', 'empathy', 'mental'];
        for (const score of requiredScores) {
            if (!(score in analysis.socialScores) || 
                typeof analysis.socialScores[score] !== 'number' ||
                analysis.socialScores[score] < 1 || 
                analysis.socialScores[score] > 5) {
                console.error(`Invalid score for ${score}:`, analysis.socialScores[score]);
                res.status(502).json({ 
                    error: '分析結果のスコアが正しくありません',
                    details: `Invalid score for ${score}`,
                    scores: analysis.socialScores
                });
                return;
            }
        }
        
        // careerSummaryがない場合はデフォルト値を設定
        if (!analysis.careerSummary) {
            analysis.careerSummary = '提供された経歴情報に基づいて社会的能力を分析しました。';
        }
        
        console.log('Resume analysis completed successfully');
        console.log('Analysis result preview:', {
            hasScores: !!analysis.socialScores,
            hasAnalysis: !!analysis.socialAnalysis,
            hasSummary: !!analysis.careerSummary
        });
        
        res.status(200).json(analysis);
        
    } catch (error) {
        console.error('=== Resume Analysis Error ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        let errorMessage = '履歴書分析中にエラーが発生しました';
        let statusCode = 500;
        
        if (error.message.includes('API key')) {
            errorMessage = 'API設定エラー';
            statusCode = 500;
        } else if (error.message.includes('解析')) {
            errorMessage = '分析結果の処理に失敗しました';
            statusCode = 502;
        } else if (error.message.includes('Missing') || error.message.includes('Invalid')) {
            errorMessage = '分析結果の形式が正しくありません';
            statusCode = 502;
        }
        
        res.status(statusCode).json({ 
            error: errorMessage,
            details: error.message,
            type: error.constructor.name
        });
    }
} 
