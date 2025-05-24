const { GoogleGenerativeAI } = require('@google/generative-ai');

// CORS ヘッダーを設定する関数
function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// JSONレスポンスを安全に解析する関数
function extractJSON(text) {
    // コードブロックやマークダウンを除去
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
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

module.exports = async (req, res) => {
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
        const { resumeText } = req.body;
        
        if (!resumeText || typeof resumeText !== 'string') {
            res.status(400).json({ error: '履歴書・職務経歴書のテキストが必要です' });
            return;
        }
        
        // Gemini API key のチェック
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not set');
            res.status(500).json({ error: 'API key not configured' });
            return;
        }
        
        // Google Generative AI の初期化
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
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
        
        // Gemini API リクエスト
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Raw Gemini API response:', text);
        
        // JSONを抽出・解析
        const analysis = extractJSON(text);
        
        // 必須フィールドの検証
        const requiredFields = ['socialScores', 'socialAnalysis'];
        for (const field of requiredFields) {
            if (!(field in analysis)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // socialScoresの検証
        const requiredScores = ['communication', 'leadership', 'adaptability', 'selfManagement', 'empathy', 'mental'];
        for (const score of requiredScores) {
            if (!(score in analysis.socialScores) || 
                typeof analysis.socialScores[score] !== 'number' ||
                analysis.socialScores[score] < 1 || 
                analysis.socialScores[score] > 5) {
                throw new Error(`Invalid score for ${score}`);
            }
        }
        
        // careerSummaryがない場合はデフォルト値を設定
        if (!analysis.careerSummary) {
            analysis.careerSummary = '提供された経歴情報に基づいて社会的能力を分析しました。';
        }
        
        console.log('Resume analysis completed successfully:', analysis);
        
        res.status(200).json(analysis);
        
    } catch (error) {
        console.error('Resume analysis error:', error);
        
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
            details: error.message 
        });
    }
}; 