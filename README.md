# Brain Function & Social Humanity Hexagraph

脳機能と社会的能力を分析・可視化するWebアプリケーションです。12の質問に答えることで、6つの軸からなる2つのヘキサグラフ（レーダーチャート）を生成し、個人の能力特性を視覚的に表現します。

## 🌟 特徴

- **脳機能分析**: 記憶・学習、思考・計画、感情、運動、感覚、習慣・直感の6軸
- **社会的能力分析**: コミュニケーション、リーダーシップ、学習・適応力、セルフマネジメント、対人理解・共感力、メンタルの6軸
- **AI分析**: Google Gemini 2.0 Flashモデルによる高精度な分析
- **美しいUI**: モダンなデザインとアニメーション
- **結果ダウンロード**: 分析結果を画像として保存可能
- **レスポンシブ対応**: スマートフォン・タブレット・PCに対応

## 🚀 GitHub + Vercel でのデプロイ手順

### 1. GitHubリポジトリの作成

1. GitHubで新しいリポジトリを作成
2. プロジェクトファイルをGitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### 2. Google Gemini APIキーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. 新しいAPIキーを作成
3. APIキーをコピーして保存（後でVercelで使用）

### 3. Vercelでのデプロイ

1. [Vercel](https://vercel.com/) にアクセスしてログイン
2. "New Project" をクリック
3. GitHubリポジトリを選択してインポート
4. プロジェクト設定でEnvironment Variablesを設定：
   - Variable Name: `GEMINI_API_KEY`
   - Value: 取得したGoogle Gemini APIキー
   - Environment: Production, Preview, Development すべてにチェック
5. "Deploy" をクリック

### 4. デプロイ完了

数分でデプロイが完了し、Vercelから提供されるURLでアプリにアクセスできます。

## 📁 プロジェクト構造

```
Brain Function Hexagraph&Social Humanity Hexagraph/
├── index.html          # メインHTMLファイル
├── script.js           # JavaScriptロジック
├── styles.css          # CSSスタイル
├── api/
│   └── analyze.js      # Vercelサーバーレス関数
├── vercel.json         # Vercel設定ファイル
├── env.example         # 環境変数テンプレート
└── README.md           # このファイル
```

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **チャート**: Chart.js (レーダーチャート)
- **AI分析**: Google Gemini 2.0 Flash API
- **デプロイ**: Vercel (サーバーレス関数)
- **バージョン管理**: Git + GitHub

## 🔒 セキュリティ

- APIキーはサーバーサイド（Vercelの環境変数）で管理
- クライアントサイドにAPIキーは露出されません
- CORS設定によりセキュアなAPI通信を実現

## 📊 分析内容

### 脳機能ヘキサグラフ
1. **記憶・学習** (Hippocampus) - 海馬の機能
2. **思考・計画** (Prefrontal Cortex) - 前頭前野の機能
3. **感情** (Amygdala) - 扁桃体の機能
4. **運動** (Motor Cortex & Cerebellum) - 運動野・小脳の機能
5. **感覚** (Visual & Auditory Cortex) - 視覚野・聴覚野の機能
6. **習慣・直感** (Basal Ganglia & Cerebellum) - 基底核・小脳の機能

### 社会的能力ヘキサグラフ
1. **コミュニケーション** - 対人コミュニケーション能力
2. **リーダーシップ** - 指導力・協働力
3. **学習・適応力** - 新しい環境への適応能力
4. **セルフマネジメント** - 自己管理能力
5. **対人理解・共感力** - 他者理解・共感能力
6. **メンタル** - 精神的健康・ストレス管理

## 🎯 対象ユーザー

- 就職活動中の学生・求職者
- 採用担当者・人事関係者
- 自己分析を行いたい個人
- チームビルディングを行う組織

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 サポート

問題やフィードバックがございましたら、GitHubのIssuesでお知らせください。 