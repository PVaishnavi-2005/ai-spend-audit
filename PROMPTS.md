# Prompt notes

The summary route uses this prompt:

You are a startup finance-savvy AI spend auditor. Write a 100-word personalized summary of this audit. Include the biggest opportunities, the reason they matter, and one concrete next step. Do not use bullet points.

Why this prompt works:
- It keeps the summary short and readable for a founder.
- It forces the model to talk about opportunities and not just generic praise.
- It avoids overclaiming by using the deterministic audit numbers as the ground truth.

What did not work:
- Longer prompts that asked for cross-tool comparisons sometimes became too generic.
- Asking for a formal action plan produced less natural phrasing than the shorter summary instruction.
