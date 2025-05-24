// グローバル変数
let brainChart = null;
let socialChart = null;
let currentUserName = '';

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    const form = document.getElementById('questionForm');
    const loading = document.getElementById('loading');
    const questionnaire = document.getElementById('questionnaire');
    const results = document.getElementById('results');
    const downloadBtn = document.getElementById('downloadBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');

    // フォーム送信処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted');
        
        // 名前と回答データを収集
        const userName = document.getElementById('userName').value.trim();
        const answers = {
            q1: document.getElementById('q1').value,
            q2: document.getElementById('q2').value,
            q3: document.getElementById('q3').value,
            q4: document.getElementById('q4').value,
            q5: document.getElementById('q5').value,
            q6: document.getElementById('q6').value,
            q7: document.getElementById('q7').value,
            q8: document.getElementById('q8').value,
            q9: document.getElementById('q9').value,
            q10: document.getElementById('q10').value,
            q11: document.getElementById('q11').value,
            q12: document.getElementById('q12').value
        };

        if (!userName) {
            alert('お名前を入力してください。');
            return;
        }

        // グローバル変数に名前を保存
        currentUserName = userName;

        console.log('User name:', userName);
        console.log('Answers collected:', answers);
        console.log('Starting analysis...');

        // ローディング表示
        loading.style.display = 'flex';
        questionnaire.style.display = 'none';

        try {
            // サーバーレス関数にリクエスト
            console.log('Calling serverless function...');
            const analysis = await analyzeAnswers(answers);
            console.log('Analysis completed:', analysis);
            
            // 結果を表示
            displayResults(analysis);
            
            // 結果セクションを表示
            loading.style.display = 'none';
            results.style.display = 'block';
        } catch (error) {
            console.error('エラー:', error);
            alert(`分析中にエラーが発生しました: ${error.message}`);
            loading.style.display = 'none';
            questionnaire.style.display = 'block';
        }
    });

    // ダウンロードボタン
    downloadBtn.addEventListener('click', downloadCharts);

    // 新しい分析ボタン
    newAnalysisBtn.addEventListener('click', () => {
        results.style.display = 'none';
        questionnaire.style.display = 'block';
        form.reset();
        currentUserName = '';
    });
});

// サーバーレス関数を使用して回答を分析
async function analyzeAnswers(answers) {
    try {
        console.log('Making request to serverless function...');
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                answers: answers
            })
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            
            const errorMessage = errorData.error || '分析処理でエラーが発生しました';
            throw new Error(`API Error: ${response.status} - ${errorMessage}`);
        }

        const data = await response.json();
        console.log('Analysis result:', data);
        
        return data;
        
    } catch (error) {
        console.error('Analysis Error:', error);
        throw error;
    }
}

// 結果を表示
function displayResults(analysis) {
    console.log('Displaying results:', analysis);
    
    // 結果タイトルを名前付きに更新
    const resultsTitle = document.getElementById('resultsTitle');
    if (currentUserName) {
        resultsTitle.textContent = `${currentUserName}さんの分析結果`;
    } else {
        resultsTitle.textContent = '分析結果';
    }
    
    // 脳機能グラフを描画（オレンジ系）
    const brainCtx = document.getElementById('brainChart').getContext('2d');
    const brainData = {
        labels: [
            '記憶・学習',
            '思考・計画',
            '感情',
            '運動',
            '感覚',
            '習慣・直感'
        ],
        datasets: [{
            label: '脳機能',
            data: [
                analysis.brainScores.memory,
                analysis.brainScores.logic,
                analysis.brainScores.emotion,
                analysis.brainScores.movement,
                analysis.brainScores.senses,
                analysis.brainScores.habits
            ],
            backgroundColor: 'rgba(251, 146, 60, 0.15)',
            borderColor: 'rgba(251, 146, 60, 0.8)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(251, 146, 60, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(251, 146, 60, 1)',
            pointHoverBorderWidth: 3,
            pointHoverRadius: 7
        }]
    };

    // 社会的能力グラフを描画（抹茶色）
    const socialCtx = document.getElementById('socialChart').getContext('2d');
    const socialData = {
        labels: [
            'コミュニケーション',
            'リーダーシップ',
            '学習・適応力',
            'セルフマネジメント',
            '対人理解・共感力',
            'メンタル'
        ],
        datasets: [{
            label: '社会的能力',
            data: [
                analysis.socialScores.communication,
                analysis.socialScores.leadership,
                analysis.socialScores.adaptability,
                analysis.socialScores.selfManagement,
                analysis.socialScores.empathy,
                analysis.socialScores.mental
            ],
            backgroundColor: 'rgba(76, 140, 74, 0.15)',
            borderColor: 'rgba(76, 140, 74, 0.8)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(76, 140, 74, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(76, 140, 74, 1)',
            pointHoverBorderWidth: 3,
            pointHoverRadius: 7
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            r: {
                angleLines: {
                    display: true,
                    color: 'rgba(156, 163, 175, 0.3)'
                },
                grid: {
                    color: 'rgba(156, 163, 175, 0.2)'
                },
                suggestedMin: 0,
                suggestedMax: 5,
                ticks: {
                    stepSize: 1,
                    color: 'rgba(107, 114, 128, 0.8)',
                    backdropColor: 'transparent'
                },
                pointLabels: {
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    color: 'rgba(55, 65, 81, 0.9)'
                }
            }
        }
    };

    // 既存のチャートがあれば破棄
    if (brainChart) brainChart.destroy();
    if (socialChart) socialChart.destroy();

    // 新しいチャートを作成
    brainChart = new Chart(brainCtx, {
        type: 'radar',
        data: brainData,
        options: chartOptions
    });

    socialChart = new Chart(socialCtx, {
        type: 'radar',
        data: socialData,
        options: chartOptions
    });

    // 分析結果を表示
    document.getElementById('brainAnalysis').innerHTML = `<p>${analysis.brainAnalysis}</p>`;
    document.getElementById('socialAnalysis').innerHTML = `<p>${analysis.socialAnalysis}</p>`;
    
    console.log('Charts created successfully');
}

// チャートを画像としてダウンロード
function downloadCharts() {
    // 一時的なキャンバスを作成
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // キャンバスのサイズを設定
    tempCanvas.width = 1200;
    tempCanvas.height = 600;
    
    // 背景を白に
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // タイトルを描画（名前付き）
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    const title = currentUserName ? `${currentUserName}さんの分析結果` : 'Brain Function & Social Humanity Hexagraph';
    ctx.fillText(title, tempCanvas.width / 2, 40);
    
    // 両方のチャートを並べて描画
    const brainCanvas = document.getElementById('brainChart');
    const socialCanvas = document.getElementById('socialChart');
    
    ctx.drawImage(brainCanvas, 50, 80, 500, 500);
    ctx.drawImage(socialCanvas, 650, 80, 500, 500);
    
    // ラベルを追加
    ctx.font = '18px Arial';
    ctx.fillText('脳機能ヘキサグラフ', 300, 70);
    ctx.fillText('社会的能力ヘキサグラフ', 900, 70);
    
    // 画像としてダウンロード（ファイル名に名前を含める）
    const link = document.createElement('a');
    const fileName = currentUserName ? `${currentUserName}_hexagraph_analysis.png` : 'hexagraph_analysis.png';
    link.download = fileName;
    link.href = tempCanvas.toDataURL();
    link.click();
} 