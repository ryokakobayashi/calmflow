　<p align="center">
  <h1 align="center">🌊 CalmFlow</h1>
  <p align="center">
    <strong>学生のための、穏やかで集中できる学習管理ダッシュボード</strong><br>
    <em>A calm, focused study management dashboard for students</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/HTML-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML">
    <img src="https://img.shields.io/badge/CSS-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
    <img src="https://img.shields.io/badge/No_Framework-Vanilla_JS-yellow" alt="Vanilla JS">
  </p>
</p>

---

## 📖 CalmFlowとは？

CalmFlowは、学生が勉強に集中するための**オールインワン学習管理ツール**です。  
カレンダー、Todoリスト、勉強タイマー、サイト制御を一つの画面にまとめました。

サーバー不要、フレームワーク不要。HTMLファイル1つをブラウザで開くだけで使えます。

> 💡 **開発の背景**: 大学生活の中で、予定管理・Todo・勉強時間の記録がバラバラのアプリに散らばっていたのが不便で、全部一つにまとめたいと思い開発しました。AIの力も借りつつ、自分で設計・カスタマイズしながら作り上げたプロジェクトです。

---

## ✨ 主な機能

### 📅 カレンダー
- 月間カレンダーで予定を一覧表示
- **日付をクリック → デイリープランナー**に切り替え
- セル内をクリックで予定をすばやく追加
- 複数日にまたがる予定は**連結バー**で表示
- 終日イベント・時間指定イベントの両方に対応
- 予定をクリックして編集・削除
- カレンダーに表示されない個人用スケジュールも追加可能

### 📝 デイリープランナー
- 時間軸ベースのスケジュール表示（0時〜23時）
- 予定の時間帯が**色ブロック**で視覚化
- その日のTodo一覧（優先度表示付き）
- メモ・日記欄

### ✅ Todoリスト
- 優先度（高・中・低）付きタスク管理
- 期限設定と**残り日数の自動表示**（今日、明日、あと○日、○日超過）
- フィルター: すべて / 未完了 / 完了 / 期限切れ
- 優先度順に自動ソート

### ⏱ 勉強タイマー
- **ポモドーロタイマー**: 25分 / 50分 / カスタム時間設定
- **ストップウォッチ**: 自由に時間計測
- **科目別記録**: 数学、英語、理科など科目ごとに勉強時間を自動集計
- 途中終了して記録する機能
- 手動で勉強時間を追加・削除できるログ編集機能

### 📊 勉強統計
- 今日 / 今週 / 今月 / 全期間の勉強時間
- **棒グラフ**: 日間・週間・月間で切り替え表示
- 科目別の内訳と進捗バー
- 1日・月間の目標設定と達成率プログレスバー
- 連続勉強日数（ストリーク）
- セッション数

### 🚫 サイト制御（集中モード）
- ブロックしたいサイトをリストに追加
- 集中モードON/OFFでリマインダー表示

### ⚙ 設定
- **言語切替**: 🇯🇵 日本語 / 🇺🇸 English
- **テーマカラー**: ダーク / ライト / ピンク / 水色 / パープル
- **カラーピッカー**: 予定・科目にプリセット + カスタムカラーを設定可能

---

## 🚀 使い方

### 方法1: そのまま開く（最も簡単）
```bash
# リポジトリをクローン
git clone https://github.com/YOUR_USERNAME/calmflow.git

# ブラウザで開く
open calmflow/index.html
```

### 方法2: GitHub Pagesでデプロイ（URLで公開）
1. このリポジトリをForkする
2. Settings → Pages → Source: `main` branch → `/ (root)`
3. Saveを押す
4. 数分後に `https://YOUR_USERNAME.github.io/calmflow/` でアクセス可能に！

### 方法3: Vercel / Netlifyでデプロイ
1. [Vercel](https://vercel.com) または [Netlify](https://netlify.com) にサインアップ
2. GitHubリポジトリを連携
3. 自動でデプロイされます

---

## 📁 プロジェクト構成

```
calmflow/
├── index.html          # メインアプリケーション（HTML + CSS + JS 一体型）
├── README.md           # このファイル
├── LICENSE             # MITライセンス
└── docs/
    └── CONTRIBUTING.md # コントリビューションガイド
```

---

## 🛠 技術スタック

| 技術 | 用途 |
|------|------|
| **HTML5** | ページ構造 |
| **CSS3** | スタイリング、テーマ切替、アニメーション |
| **Vanilla JavaScript** | 全てのロジック（フレームワーク不使用） |
| **localStorage** | データの永続化（サーバー不要） |
| **Google Fonts** | Noto Sans JP + JetBrains Mono |

### なぜフレームワークを使わないのか？

- **学習目的**: HTML/CSS/JSの基礎をしっかり理解するため
- **シンプルさ**: ファイル1つで完結、ビルド不要
- **軽量**: 外部依存なし、読み込み速度が速い
- **デプロイが簡単**: どこでもHTMLファイルを開くだけ

---

## 💾 データの保存について

CalmFlowはブラウザの`localStorage`にデータを保存します。

- ✅ サーバー不要、アカウント登録不要
- ✅ オフラインでも動作
- ⚠️ ブラウザのデータを消去するとリセットされます
- ⚠️ 別のブラウザ/デバイスとは同期されません

---

## 🎨 テーマプレビュー

| ダーク | ライト | ピンク | 水色 | パープル |
|--------|--------|--------|------|----------|
| 🌑 | ☀️ | 🌸 | 🌊 | 💜 |

---

## 🤝 コントリビューション

プルリクエスト歓迎です！

1. このリポジトリをFork
2. 新しいブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add amazing feature'`
4. プッシュ: `git push origin feature/amazing-feature`
5. プルリクエストを作成

詳しくは [CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

---

## 📋 今後のロードアウト

- [ ] React版への移行
- [ ] PWA対応（オフライン完全対応）
- [ ] データのエクスポート/インポート機能
- [ ] クラウド同期（Firebase連携）
- [ ] 勉強仲間とのデータ共有機能
- [ ] ダークモード自動切替（OS設定連動）
- [ ] ドラッグ＆ドロップでTodoの並び替え
- [ ] 通知機能（ブラウザ通知）

---

## 📝 ライセンス

[MIT License](LICENSE) - 自由に使用・改変・再配布できます。

---

## 🙏 クレジット

- フォント: [Google Fonts](https://fonts.google.com/) (Noto Sans JP, JetBrains Mono)
- 開発支援: [Claude AI](https://claude.ai) by Anthropic

---

<p align="center">
  <strong>⭐ このプロジェクトが役に立ったら、Starをお願いします！</strong>
</p>

