# AI Usage Write-up

**Which parts of the system did Claude write end-to-end?**
Claude did not write many components end-to-end. Instead, Claude mostly handled the initial planning, brainstorming, and structuring phases. I took the lead on most architectural decisions, actively analyzing the pros and cons of various tech stacks (such as choosing FastAPI and SQLite over a heavy external database, or selecting Framer Motion for the UI) before implementing them.

**Where did you have to push back on, fix, or rewrite Claude’s output? Give one concrete example.**
One concrete example was during the implementation of the swipe animations. The AI initially provided a generic solution where clicking the "LOVE" or "CROSS" UI buttons simply popped the card out of the DOM instantly without any smooth transition. I had to push back and instruct the AI to rewrite the logic using Framer Motion's `useImperativeHandle` and `AnimatePresence` so that clicking the buttons programmatically triggered the exact same satisfying physics-based `swipeOut` animations as manually dragging the cards.

**One thing the AI did better than expected, and one thing it did worse.**
- **Better:** The AI was remarkably good at generating the complex boilerplate for the physics-based Framer Motion dragging constraints (handling drag thresholds, rotation calculations based on velocity, and snapping back).
- **Worse:** The AI struggled with React state synchronization across different views. For example, it initially scoped the "Undo" button visibility to a local component state. Whenever I navigated to the Results tab and back, the component would unmount and the Undo button would disappear. I had to explicitly tell it to lift the state up to the root `App` component and refetch analytics on mount to ensure persistent UI states.

**If you used other AI tools alongside Claude, what role did each play?**
I used **Claude** primarily for the high-level planning, architectural brainstorming, and detailing the step-by-step implementation plan. I then used **Gemini** (in the IDE) to assist with the actual coding, debugging, and execution of the implementation steps inside the codebase.
