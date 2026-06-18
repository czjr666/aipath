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
5. Identify diagram opportunities. If a process, branching logic, feedback loop, layered structure, before/after comparison, data pipeline, or cause-effect chain would be clearer visually, produce an React/SVG flowchart artifact in addition to text feedback.
6. Report findings before summaries. Include exact file/line references when reviewing files.
7. When asked to modify the content, apply concise edits and verify the build or relevant rendering path.

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

## Excalidraw Requirement

If a diagram is warranted and the user has not forbidden file changes, create an editable Excalidraw artifact, not just a prose suggestion.

Use `.excalidraw` JSON unless the repo already has a diagram convention. Store it near the lesson or in an appropriate assets/media directory. Name it descriptively, for example:

- `rule-explosion.excalidraw`
- `training-loop.excalidraw`
- `rag-pipeline.excalidraw`

The diagram must:

- Have a clear title.
- Use simple nodes with short Chinese labels.
- Show direction with arrows.
- Use color sparingly to distinguish states such as normal/risk/failure.
- Include a short caption or note if a visual shortcut could be misunderstood.
- Be editable in Excalidraw.

When the project needs an embedded runtime diagram rather than a source artifact, use the Excalidraw file as the design source and implement the lesson rendering with the repo's existing UI technology, such as React/SVG/Canvas, unless the user explicitly wants an embedded Excalidraw editor.

## Review Output Format

For review-only requests:

1. Findings first, ordered by severity or reading impact.
2. Each finding includes file/line, the issue, and a concrete replacement.
3. Add a "Source notes" section for missing or recommended external links/notes.
4. Add a "Terminology" section for missing English labels on professional terms.
5. Add a "Diagram opportunities" section if any diagram is warranted.
6. If no major issues, say so and list minor polish only.

For edit requests:

1. State the edit scope briefly.
2. Modify only the requested lesson/content.
3. Preserve bilingual structure and interactive logic unless asked otherwise.
4. Add source notes and terminology labels when the edit touches relevant concepts.
5. Verify with the relevant command, usually the app's build command.

## Common Mistakes

- Do not rewrite everything into bland textbook prose. Preserve the course's friendly voice.
- Do not remove all English technical terms; keep terms learners need, but explain them naturally.
- Do not leave important technical terms Chinese-only on first use.
- Do not mention external foundations as if the course invented them; add a concise source note/link where it helps credibility.
- Do not add diagrams for decoration. Add them only when they reduce cognitive load.
- Do not embed a heavy whiteboard editor into a lesson when a lightweight SVG/React rendering is enough.
