---
status: implemented
source_session: design-materials/intake/custom-character-creation.md, custom-character-format.md
source_gap: "#99, #100, #105, #106, #107"
---

<!-- DGE 生成: この Spec は DGE session から自動生成された提案です。
     実装前に必ず人間がレビューしてください。 -->

# UC-custom-character: カスタムキャラクター作成

## Trigger
- 「キャラを追加して」「ガッツを追加して」「オリジナルキャラを作りたい」

## Flow

### 名指しモード
1. ユーザーがキャラ名 + 出典を指定
2. LLM がキャラを分析:
   - axes ベクトル推定
   - Prompt Core 生成
   - Personality 抽出（価値観、名言、コミュニケーション、判断基準）
   - Backstory 抽出（背景、成長弧、トラウマ、DGE での効果）
   - 既存キャラとの類似比較
3. 確認画面を表示（MUST: 未確認で保存しない）
4. ユーザー選択:
   - OK → 保存
   - 自然言語で調整（「もっと慎重にして」→ axes 再計算）
   - 数値直指定（上級者）
   - やり直す
5. `dge/custom/characters/{name}.md` に保存

### wizard モード
1. 最低 3 問: 名前、活躍場面、性格の核
2. ユーザーが「もっと聞いて」→ 追加質問:
   - 口癖は？ 怒るとどうなる？ 苦手なことは？
   - 褒め方は？ チームでの立ち位置は？ こだわりポイントは？
3. 「もう十分」→ 生成
4. 確認 → 保存（名指しと同じフロー）

## 保存フォーマット

`dge/custom/characters/{name}.md`:

```markdown
---
name: [name]
source: [source]
archetype: [archetype_id]
icon: [emoji]
created: YYYY-MM-DD
axes:
  decision_speed: 0.00
  risk_tolerance: 0.00
  delegation_level: 0.00
  quality_obsession: 0.00
  simplicity_preference: 0.00
  communication: [enum]
  conflict_resolution: [enum]
---

# [icon] [name]（[source]）

## Prompt Core
[3-5 行]

## Personality
### 価値観
### 口癖・名言
### コミュニケーションスタイル
### 判断基準

## Backstory
### 背景
### 成長弧
### トラウマ
### DGE での効果

## Weakness

## Similar Characters
```

## 読み込みルール

| 層 | 読むタイミング | 対象 |
|---|---|---|
| Prompt Core | 常に | 選択済み全キャラ |
| Personality | デフォルト | 選択キャラのみ |
| Backstory | 「深い議論にして」時 | 選択キャラのみ |

## skill 変更

- Step 1: `dge/characters/catalog.md` + `dge/custom/characters/*.md` を読む
- Step 4: built-in + カスタムを統合表示
- 新 trigger: 「キャラを追加して」→ 名指し or wizard 選択

## Acceptance Criteria
- [ ] 「ベルセルクのガッツを追加して」で axes + prompt + personality + backstory が生成される
- [ ] 確認画面で OK / 調整 / やり直しが選べる
- [ ] 保存後、次の DGE session のキャラ選択に表示される
- [ ] wizard で最低 3 問でオリジナルキャラが作れる
- [ ] backstory は「深い議論にして」時のみ LLM に渡される
