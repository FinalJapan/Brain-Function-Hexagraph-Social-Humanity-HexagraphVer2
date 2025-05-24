export default async function handler(req, res) {
    // CORSヘッダーを設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）に対応
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { answers } = req.body;

        if (!answers) {
            res.status(400).json({ error: '回答データが必要です' });
            return;
        }

        // 環境変数からAPIキーを取得
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: 'APIキーが設定されていません' });
            return;
        }

        const model = 'gemini-2.0-flash';
        
        const prompt = `以下の12個の質問への回答を分析し、2つのヘキサグラフ（脳機能と社会的能力）のスコアを算出してください。

【脳機能ヘキサグラフの項目】
1. Hippocampus (Memory) - 海馬（記憶・学習）
2. Prefrontal Cortex (Logic) - 前頭前野（思考・計画）
3. Amygdala (Emotion) - 扁桃体（感情）
4. Motor Cortex & Cerebellum (Movement) - 運動野・小脳（運動）
5. Visual & Auditory Cortex (Senses) - 視覚野・聴覚野（感覚）
6. Basal Ganglia & Cerebellum (Habits/Intuition) - 基底核・小脳（習慣・直感）

【社会的能力ヘキサグラフの項目】
1. Communication - コミュニケーション
2. Leadership/Teamwork - リーダーシップ/協働力
3. Learning & Adaptability - 学習・適応力
4. Self-Management - セルフマネジメント
5. Empathy & Social Insight - 対人理解・共感力
6. Mental Wellness - メンタル

【回答】
質問1（記憶・学習）: ${answers.q1}
質問2（思考・計画）: ${answers.q2}
質問3（感情）: ${answers.q3}
質問4（運動）: ${answers.q4}
質問5（感覚）: ${answers.q5}
質問6（習慣・直感）: ${answers.q6}
質問7（コミュニケーション）: ${answers.q7}
質問8（リーダーシップ/協働力）: ${answers.q8}
質問9（学習・適応力）: ${answers.q9}
質問10（セルフマネジメント）: ${answers.q10}
質問11（対人理解・共感力）: ${answers.q11}
質問12（メンタル）: ${answers.q12}

必ず以下のJSON形式のみで返してください（説明文は不要）：
{
    "brainScores": {
        "memory": 1-5の数値,
        "logic": 1-5の数値,
        "emotion": 1-5の数値,
        "movement": 1-5の数値,
        "senses": 1-5の数値,
        "habits": 1-5の数値
    },
    "socialScores": {
        "communication": 1-5の数値,
        "leadership": 1-5の数値,
        "adaptability": 1-5の数値,
        "selfManagement": 1-5の数値,
        "empathy": 1-5の数値,
        "mental": 1-5の数値
    },
    "brainAnalysis": "脳機能に関する総合的な分析（200字程度）",
    "socialAnalysis": "社会的能力に関する総合的な分析（200字程度）"
}`;

        // Gemini APIにリクエスト
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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error:', errorText);
            
            let errorMessage = '分析処理でエラーが発生しました';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                // JSON解析に失敗した場合はそのまま
            }
            
            res.status(500).json({ error: errorMessage });
            return;
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            res.status(500).json({ error: 'APIからの応答が不正です' });
            return;
        }

        let responseText = data.candidates[0].content.parts[0].text;
        
        // マークダウンのコードブロックを除去
        responseText = responseText.replace(/```json\s*/g, '').replace(/\s*```/g, '').trim();
        
        try {
            const parsedData = JSON.parse(responseText);
            res.status(200).json(parsedData);
        } catch (parseError) {
            // 別の方法でJSONのみを抽出
            try {
                const firstBrace = responseText.indexOf('{');
                const lastBrace = responseText.lastIndexOf('}');
                
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    const extractedJson = responseText.substring(firstBrace, lastBrace + 1);
                    const parsedData = JSON.parse(extractedJson);
                    res.status(200).json(parsedData);
                } else {
                    throw new Error('JSONを抽出できませんでした');
                }
            } catch (secondParseError) {
                console.error('JSON解析エラー:', parseError, secondParseError);
                res.status(500).json({ error: 'AIからの応答を解析できませんでした' });
            }
        }

    } catch (error) {
        console.error('サーバーエラー:', error);
        res.status(500).json({ error: 'サーバー内部エラーが発生しました' });
    }
} 