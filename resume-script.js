// グローバル変数
let socialChart = null;
let currentUserName = '';
let uploadedFiles = [];
let extractedTexts = [];

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const form = document.getElementById('resumeForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const loading = document.getElementById('loading');
    const uploadSection = document.getElementById('uploadSection');
    const results = document.getElementById('results');
    const downloadBtn = document.getElementById('downloadBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const resumeText = document.getElementById('resumeText');

    // PDF.js設定
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // イベントリスナー設定
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
    if (uploadArea) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('dragleave', handleDragLeave);
    }
    if (resumeText) resumeText.addEventListener('input', checkFormValidity);
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFormSubmit();
        });
    }
    if (downloadBtn) downloadBtn.addEventListener('click', downloadChart);
    if (newAnalysisBtn) newAnalysisBtn.addEventListener('click', resetForm);

    // 初期状態チェック
    checkFormValidity();
});

// ドラッグオーバー処理
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

// ドラッグリーブ処理
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

// ドロップ処理
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
}

// ファイル選択処理
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

// ファイル処理
async function processFiles(files) {
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) uploadArea.classList.add('processing');
    
    for (const file of files) {
        if (isValidFile(file)) {
            uploadedFiles.push(file);
            await extractTextFromFile(file);
        } else {
            alert(`サポートされていないファイル形式です: ${file.name}`);
        }
    }
    
    if (uploadArea) uploadArea.classList.remove('processing');
    updateFileList();
    checkFormValidity();
}

// ファイル形式チェック
function isValidFile(file) {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(file.type);
}

// ファイルからテキスト抽出
async function extractTextFromFile(file) {
    try {
        let text = '';
        
        if (file.type === 'application/pdf') {
            text = await extractTextFromPDF(file);
        } else if (file.type.startsWith('image/')) {
            text = await extractTextFromImage(file);
        } else if (file.type === 'text/plain') {
            text = await extractTextFromText(file);
        } else {
            // Word文書は将来的にサポート予定
            text = `Word文書: ${file.name} (手動でテキストを入力してください)`;
        }
        
        extractedTexts.push({
            fileName: file.name,
            text: text
        });
        
    } catch (error) {
        console.error(`ファイル読み取りエラー: ${file.name}`, error);
        extractedTexts.push({
            fileName: file.name,
            text: `テキスト抽出エラー: ${file.name}`
        });
    }
}

// PDFからテキスト抽出
async function extractTextFromPDF(file) {
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.jsライブラリが読み込まれていません');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    
    return fullText.trim();
}

// 画像からテキスト抽出（プレースホルダー）
async function extractTextFromImage(file) {
    // 実装：Gemini Vision APIでOCR
    return `画像ファイル: ${file.name} (手動でテキストを入力してください)`;
}

// テキストファイルからテキスト抽出
async function extractTextFromText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file, 'UTF-8');
    });
}

// ファイルリストの更新
function updateFileList() {
    const fileList = document.getElementById('fileList');
    const uploadedFilesList = document.getElementById('uploadedFiles');
    
    if (!fileList || !uploadedFilesList) return;
    
    if (uploadedFiles.length > 0) {
        fileList.style.display = 'block';
        uploadedFilesList.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="file-info">
                    <span class="file-icon">${getFileIcon(file.type)}</span>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${formatFileSize(file.size)})</span>
                </div>
                <button type="button" class="remove-file" onclick="removeFile(${index})">削除</button>
            `;
            uploadedFilesList.appendChild(li);
        });
    } else {
        fileList.style.display = 'none';
    }
}

// ファイルアイコン取得
function getFileIcon(type) {
    if (type === 'application/pdf') return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'text/plain') return '📝';
    if (type.includes('word')) return '📄';
    return '📁';
}

// ファイルサイズフォーマット
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ファイル削除（グローバル関数として定義）
window.removeFile = function(index) {
    uploadedFiles.splice(index, 1);
    extractedTexts.splice(index, 1);
    updateFileList();
    checkFormValidity();
};

// フォームの有効性チェック
function checkFormValidity() {
    const manualText = document.getElementById('resumeText');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!manualText || !analyzeBtn) return;
    
    const hasFiles = uploadedFiles.length > 0;
    const hasContent = hasFiles || manualText.value.trim().length > 0;
    
    analyzeBtn.disabled = !hasContent;
}

// フォーム送信処理
async function handleFormSubmit() {
    const manualText = document.getElementById('resumeText');
    if (!manualText) return;
    
    // テキストを結合
    let combinedText = '';
    
    // アップロードファイルのテキスト
    if (extractedTexts.length > 0) {
        combinedText += extractedTexts.map(item => item.text).join('\n\n');
    }
    
    // 手動入力テキスト
    const inputText = manualText.value.trim();
    if (inputText) {
        if (combinedText) combinedText += '\n\n';
        combinedText += inputText;
    }
    
    if (!combinedText.trim()) {
        alert('履歴書・職務経歴書の内容を入力またはアップロードしてください。');
        return;
    }
    
    // ローディング表示
    const loading = document.getElementById('loading');
    const uploadSection = document.getElementById('uploadSection');
    const results = document.getElementById('results');
    
    if (loading) loading.style.display = 'flex';
    if (uploadSection) uploadSection.style.display = 'none';
    
    try {
        // 履歴書を分析
        const analysis = await analyzeResume(combinedText);
        
        // APIから抽出された名前をグローバル変数に保存
        currentUserName = analysis.extractedName || '分析対象者';
        
        // 結果を表示
        displayResults(analysis);
        
        // 結果セクションを表示
        if (loading) loading.style.display = 'none';
        if (results) results.style.display = 'block';
        
    } catch (error) {
        console.error('分析エラー:', error);
        alert(`分析中にエラーが発生しました: ${error.message}`);
        if (loading) loading.style.display = 'none';
        if (uploadSection) uploadSection.style.display = 'block';
    }
}

// 履歴書分析（Gemini API）
async function analyzeResume(resumeText) {
    try {
        const response = await fetch('/api/analyze-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resumeText: resumeText
            })
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorMessage = '履歴書分析でエラーが発生しました';
            
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                errorMessage = `API Error (${response.status})`;
            }
            
            throw new Error(errorMessage);
        }

        const responseText = await response.text();
        
        // JSONレスポンスを解析
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            throw new Error('分析結果の解析に失敗しました。');
        }
        
        return data;
        
    } catch (error) {
        console.error('Resume Analysis Error:', error);
        throw error;
    }
}

// 結果表示（社会的能力のみ）
function displayResults(analysis) {
    // 結果タイトルを名前付きに更新
    const resultsTitle = document.getElementById('resultsTitle');
    if (resultsTitle) {
        if (currentUserName && currentUserName !== '分析対象者') {
            resultsTitle.textContent = `${currentUserName}さんの社会的能力分析結果`;
        } else {
            resultsTitle.textContent = '社会的能力分析結果';
        }
    }
    
    // 社会的能力グラフを描画
    const socialChartCanvas = document.getElementById('socialChart');
    if (!socialChartCanvas) return;
    
    const socialCtx = socialChartCanvas.getContext('2d');
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
            backgroundColor: 'rgba(65, 105, 175, 0.15)',
            borderColor: 'rgba(65, 105, 175, 0.8)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(65, 105, 175, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(65, 105, 175, 1)',
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
    if (socialChart) socialChart.destroy();

    // 新しいチャートを作成
    if (typeof Chart !== 'undefined') {
        socialChart = new Chart(socialCtx, {
            type: 'radar',
            data: socialData,
            options: chartOptions
        });
    }

    // 分析結果を表示
    const socialAnalysisElement = document.getElementById('socialAnalysis');
    const careerSummaryElement = document.getElementById('careerSummary');
    
    if (socialAnalysisElement) {
        socialAnalysisElement.innerHTML = `<p>${analysis.socialAnalysis}</p>`;
    }
    if (careerSummaryElement) {
        careerSummaryElement.innerHTML = `<p>${analysis.careerSummary || '経歴に基づく分析結果です。'}</p>`;
    }
}

// チャートを画像としてダウンロード
function downloadChart() {
    const socialCanvas = document.getElementById('socialChart');
    if (!socialCanvas) return;
    
    // 一時的なキャンバスを作成
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // キャンバスのサイズを設定
    tempCanvas.width = 800;
    tempCanvas.height = 700;
    
    // 背景を白に
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // タイトルを描画
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    
    let title, fileName;
    if (currentUserName && currentUserName !== '分析対象者') {
        title = `${currentUserName}さんの社会的能力分析結果`;
        fileName = `${currentUserName}_social_ability_analysis.png`;
    } else {
        title = '社会的能力分析結果';
        fileName = 'social_ability_analysis.png';
    }
    
    ctx.fillText(title, tempCanvas.width / 2, 40);
    
    // チャートを描画
    const chartX = (tempCanvas.width - 600) / 2;
    const chartY = 80;
    ctx.drawImage(socialCanvas, chartX, chartY, 600, 600);
    
    // 画像としてダウンロード
    const link = document.createElement('a');
    link.download = fileName;
    link.href = tempCanvas.toDataURL();
    link.click();
}

// フォームリセット
function resetForm() {
    const results = document.getElementById('results');
    const uploadSection = document.getElementById('uploadSection');
    const form = document.getElementById('resumeForm');
    
    if (results) results.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'block';
    if (form) form.reset();
    
    // データクリア
    uploadedFiles = [];
    extractedTexts = [];
    currentUserName = '';
    
    // UIリセット
    updateFileList();
    checkFormValidity();
    
    if (socialChart) {
        socialChart.destroy();
        socialChart = null;
    }
} 
