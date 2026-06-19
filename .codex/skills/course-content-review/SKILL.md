---
name: course-content-review
description: Use when reviewing lesson articles, course chapters, tutorial copy, Chinese learner-facing explanations, AI education content, or requests to check wording, readability, terminology, examples, chapter text, or places that may need diagrams.
---

# Course Content Review

## Overview

Review course content for Chinese learner readability, conceptual clarity, and teachability. Treat the reader as smart but possibly new to the subject: reduce unnecessary friction without flattening the technical idea.

## Workflow

1. Read the target lesson/article with line numbers or stable anchors.
2. Review Chinese copy first: wording, idiom, tone, concept load, terminology, examples, and flow.
3. Check source grounding: if the lesson mentions an external paper, standard, named concept, model, historical event, or web resource, add or request an inline note/link so readers can see the course is grounded in real sources.
4. Check terminology: professional terms must show Chinese plus English on first meaningful use, for example `激活函数（activation function）`, `偏置（bias）`.
5. Check lesson continuity: each lesson should include a concise "下一课怎么接上" bridge unless it is the final lesson or the next lesson is unknown.
6. Check duration fit: compare the lesson's real content volume with its displayed estimated learning time.
7. Identify diagram opportunities. If a process, branching logic, feedback loop, layered structure, before/after comparison, data pipeline, or cause-effect chain would be clearer visually, produce a React/SVG flowchart artifact in addition to text feedback.
8. Report findings before summaries. Include exact file/line references when reviewing files.
9. When asked to modify the content, apply concise edits and verify the build or relevant rendering path.

## Chinese Learner Copy Checks

Flag and suggest replacements for:

- English-like phrasing that does not sound natural in Chinese.
- Internet slang, meme-like wording, or overly performative copy when it distracts from learning.
- Rare idioms, literary phrasing, or technical jargon introduced before it is explained.
- Programmer-centric language when the target reader is non-technical, unless the user explicitly wants to keep it.
- Ambiguous metaphors, mixed metaphors, or titles that require too much inference.
- Symbol-heavy explanations where plain Chinese would be clearer.
- Overconfident simplifications such as "all", "全部", "一定", when the concept needs nuance.
- Examples that are culturally narrow, dated, potentially confusing, or too domain-specific.
- Professional terms shown only in Chinese when the English term is needed for future search, reading docs, or reading papers.
- External references, papers, model names, historical claims, or standards mentioned without a short source note or link.

Prefer replacements that are:

- Direct and idiomatic Chinese.
- Slightly conversational but not gimmicky.
- Technically accurate enough for later lessons to build on.
- Short enough to fit the existing UI.

## Source Notes and Links

If a chapter contains external grounding, make it visible to learners. Examples:

- A paper or historical source: `McCulloch-Pitts 神经元（1943）` should have a footnote/link to the paper or a reliable reference.
- A named function or concept: `sigmoid` or `ReLU` should link or note that these are standard activation functions when first introduced.
- A protocol, benchmark, model family, library, or product: provide an official doc, paper, or stable reference when possible.

**Placement rule: keep links out of the body. Do not put reference links inline in the prose.** Collect them into a single source note at the foot of the section, rendered as a footnote element (the repo convention is `<p className="footnote source-note">…</p>`, as in `L03.jsx`'s `brainSourceNote` / `actSourceNote`). The body text stays clean and readable; the footer is where curious learners go to verify. One footer note per section is enough — if a section grounds several claims, combine them into one note separated by `；`/`;` rather than scattering links through the paragraphs.

Prefer concise notes over academic citation clutter. A single footnote-style sentence is enough when the lesson is not research-heavy. If no source can be verified locally and the fact is not common/stable, browse or ask before adding a link.

## Terminology Rule

On first meaningful use in Chinese content, write professional terms as `中文（English）`. After that, Chinese-only is fine unless the English term helps disambiguate.

Use this especially for terms learners will search later:

- 权重（weight）
- 偏置（bias）
- 激活函数（activation function）
- sigmoid / ReLU
- 监督学习（supervised learning）
- 无监督学习（unsupervised learning）
- 强化学习（reinforcement learning）
- 反向传播（backpropagation）
- 嵌入（embedding）
- 注意力机制（attention）
- 检索增强生成（RAG, Retrieval-Augmented Generation）

## Lesson Continuity Rule

Each non-final lesson should end with a short bridge to the next lesson. This keeps the course feeling like a guided path rather than isolated articles.

Use a concise section such as `➡️ 下一课怎么接上`:

- One short paragraph, usually 1-3 sentences.
- Explain what this lesson established.
- Name the next lesson's question or next conceptual move.
- Do not summarize the whole lesson again.
- Do not introduce heavy new concepts that belong in the next lesson.
- If helpful, add a tiny 3-4 step flow, for example `人写规则 → 规则越写越多 → 机器从数据里找规则 → 进入机器学习`.

Review for missing or weak bridges. When editing a lesson, add or tighten the bridge if the next lesson is known from the course order.

## Duration Fit Rule

Do not assume the displayed lesson duration is correct. Estimate the actual learning time from the content itself and flag mismatches.

When reviewing a lesson, estimate time from:

- Chinese reading volume and concept density.
- Number and difficulty of new terms.
- Interactive demos and how long a learner needs to try them.
- Examples, flip cards, quizzes, and reflection tasks.
- Source notes or optional reading, counted as optional time only.

Use practical ranges, not fake precision: `8-12 分钟`, `15-18 分钟`, `20-25 分钟`.

If the displayed time is wrong, recommend one of two actions:

- Adjust the displayed time to match the real lesson.
- Expand or trim the lesson if the course promises a fixed duration such as "每课 20 分钟".

Flag especially when every lesson is hard-coded to `约 20 分钟` / `~20 min` but the actual content clearly varies.

### Real-duration source of truth (this repo)

Lesson duration is NOT a single global string. Each lesson carries its own `minutes` integer in `src/data/lessons.js`, rendered by `t.lesson.minutes(n)` in `src/pages/LessonPage.jsx` (with a `?? 20` fallback). Duration must reflect real content volume, never a uniform placeholder.

When reviewing a lesson, always compute its real time and set/update that lesson's `minutes` field if it is missing or off by more than ~2 minutes. Estimate with this baseline, then nudge by judgment:

- Reading: Chinese character count of the lesson's `zh` content ÷ ~280 chars per minute (technical prose with think-time; the zh layer only — do not count the duplicated `en` layer or code).
- Interaction: ~2 minutes per mounted interactive demo; add more for demos that invite real fiddling (3D scenes, multi-step steppers) and less for single-click toggles.
- Concept density: nudge up for math-heavy or formula-dense lessons, quizzes that require computation, and tightly packed new terms.

A quick way to get the reading proxy: count CJK characters per lesson file (e.g. `grep -oE "[一-龥]" Lxx.jsx | wc -l`) and subtract a small constant for comments.

Keep homepage / marketing copy consistent with reality: if individual lessons span a wide range, the homepage must state a range (e.g. `每课约 10–30 分钟`), not a fixed `每课 20 分钟`. Update `src/i18n/strings.js` (`home.subhead`, `home.usageSub`) and the `单课时长` / `Per lesson` stat value in `src/pages/Home.jsx` together so they never contradict the per-lesson numbers.

## Diagram Trigger Rules

When reviewing, actively look for text that should become a diagram. Do not wait for the user to ask.

Create or recommend a diagram when the text contains:

- A workflow: "收集数据 → 训练 → 上线 → 重新训练".
- Branching rules: multiple `if` checks, filters, decisions, or failure paths.
- A loop: "猜 → 比对 → 微调 → 再猜".
- A comparison: "传统编程 vs 机器学习", "RAG vs 微调".
- A pipeline: "切块 → embedding → 向量库 → 检索 → prompt".
- Rule explosion, cascading exceptions, or interactions between many conditions.
- A layered/nested structure that readers must hold in memory.

Do not create a diagram for a simple definition, a single sentence contrast, or content already clear as a short table.

## Interactive Diagram Requirement

This project favors playable, interactive diagrams over static images. When a diagram is warranted and the user has not forbidden file changes, implement it with the repo's existing UI technology (React/SVG/Canvas) so learners can interact with it, rather than only suggesting it in prose.

If you need a design source before implementing, sketch the structure as an editable `.excalidraw` JSON file and store it near the lesson or in an appropriate assets/media directory. Name it descriptively, for example:

- `rule-explosion.excalidraw`
- `training-loop.excalidraw`
- `rag-pipeline.excalidraw`

The diagram must:

- Have a clear title.
- Use simple nodes with short Chinese labels.
- Show direction with arrows.
- Use color sparingly to distinguish states such as normal/risk/failure.
- Include a short caption or note if a visual shortcut could be misunderstood.
- Prefer an interactive React/SVG rendering embedded in the lesson; use an embedded Excalidraw editor only when the user explicitly asks for one.

## Review Output Format

For review-only requests:

1. Findings first, ordered by severity or reading impact.
2. Each finding includes file/line, the issue, and a concrete replacement.
3. Add a "Source notes" section for missing or recommended external links/notes.
4. Add a "Terminology" section for missing English labels on professional terms.
5. Add a "Lesson continuity" section if the bridge to the next lesson is missing, too long, or unclear.
6. Add a "Duration fit" section comparing estimated actual time with displayed time.
7. Add a "Diagram opportunities" section if any diagram is warranted.
8. If no major issues, say so and list minor polish only.

For edit requests:

1. State the edit scope briefly.
2. Modify only the requested lesson/content.
3. Preserve bilingual structure and interactive logic unless asked otherwise.
4. Add source notes and terminology labels when the edit touches relevant concepts.
5. Add or tighten the concise next-lesson bridge when the next lesson is known.
6. Adjust duration metadata or content volume when the requested edit changes the real learning time enough to matter.
7. Verify with the relevant command, usually the app's build command.

## Common Mistakes

- Do not rewrite everything into bland textbook prose. Preserve the course's friendly voice.
- Do not remove all English technical terms; keep terms learners need, but explain them naturally.
- Do not leave important technical terms Chinese-only on first use.
- Do not mention external foundations as if the course invented them; add a concise source note/link where it helps credibility.
- Do not leave a lesson feeling like a standalone article when the next lesson has a clear conceptual handoff.
- Do not accept hard-coded `20 分钟` / `20 min` estimates when the lesson's real volume is clearly shorter or longer.
- Do not add diagrams for decoration. Add them only when they reduce cognitive load.
- Do not embed a heavy whiteboard editor into a lesson when a lightweight SVG/React rendering is enough.
