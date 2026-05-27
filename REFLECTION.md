1. The hardest bug I hit this week was making the audit math deterministic while still sounding natural in the AI summary. I debugged it by separating the rule engine from the summary generation, which let me verify the numbers first and only then layer the narrative on top.

2. I reversed the plan to make the audit page live-update instead of waiting for a separate submit step. That adjustment made the tool feel more like a real product and reduced the number of hidden clicks for the first-time user.

3. If I had a week 2, I would add a benchmark mode, PDF export, and real lead capture analytics so the audit can be used as a stronger growth engine.

4. I used AI mainly for drafting the summary copy and for validating the wording of the recommendations. I did not trust AI to be the source of truth for the pricing math, so I kept the engine deterministic and tested it with unit tests.

5. Self-rating: discipline 8/10, code quality 8/10, design sense 7/10, problem solving 8/10, entrepreneurial thinking 8/10. The product is workable, but the next phase should focus on validation and deployment polish.
