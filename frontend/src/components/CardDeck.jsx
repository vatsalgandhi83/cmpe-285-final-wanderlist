import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import EndOfDeck from "./EndOfDeck";
import { undoVote } from "../api/client";
import "../styles/CardDeck.css";

export default function CardDeck({ items, onSwipe, onViewResults, sessionId, initialCanUndo }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [extraCards, setExtraCards] = useState([]);  // cards returned via undo
  const [canUndo, setCanUndo] = useState(initialCanUndo || false);
  const [undoing, setUndoing] = useState(false);
  const cardRefs = useRef(new Map());

  // Sync canUndo if it changes from App (like after a reload or tab switch)
  useEffect(() => {
    setCanUndo(initialCanUndo);
  }, [initialCanUndo]);

  // Effective deck: original items from currentIndex onward + any undo'd cards prepended
  const remainingItems = [...extraCards, ...items.slice(currentIndex)];
  const deckFinished = remainingItems.length === 0;

  const handleSwipe = useCallback(
    (choice) => {
      const item = remainingItems[0];
      if (!item) return;

      // If the swiped card was from extraCards, remove it; else advance index
      if (extraCards.length > 0 && extraCards[0].id === item.id) {
        setExtraCards((prev) => prev.slice(1));
      } else {
        setCurrentIndex((prev) => prev + 1);
      }

      setCanUndo(true);
      onSwipe(item, choice);
    },
    [remainingItems, extraCards, onSwipe]
  );

  const handleUndo = useCallback(async () => {
    if (undoing) return;
    setUndoing(true);
    try {
      const { item } = await undoVote(sessionId);
      // Prepend the item back to the deck
      setExtraCards((prev) => [item, ...prev]);
      // Button stays visible to allow stacked undos!
    } catch (err) {
      console.error("Undo failed:", err);
      // Hide button if backend says there are no more votes to undo
      setCanUndo(false);
    } finally {
      setUndoing(false);
    }
  }, [undoing, sessionId]);

  if (deckFinished) {
    return <EndOfDeck total={items.length} onViewResults={onViewResults} />;
  }

  const visibleCards = remainingItems.slice(0, 3);

  return (
    <div className="card-deck">
      <div className="card-stack">
        <AnimatePresence>
          {visibleCards.map((item, i) => (
            <SwipeCard
              key={item.id}
              item={item}
              ref={(el) => {
                if (el) cardRefs.current.set(item.id, el);
                else cardRefs.current.delete(item.id);
              }}
              onSwipe={i === 0 ? handleSwipe : undefined}
              isTop={i === 0}
              stackIndex={i}
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="deck-progress">
        {remainingItems.length} destinations left
      </div>

      <div className="swipe-buttons">
        <button 
          className="btn-no" 
          onClick={() => {
            const topItem = remainingItems[0];
            if (topItem) cardRefs.current.get(topItem.id)?.swipeOut(-1);
          }}
        >✗</button>

        {canUndo && (
          <motion.button
            className="btn-undo"
            onClick={handleUndo}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            ↩
          </motion.button>
        )}

        <button 
          className="btn-yes" 
          onClick={() => {
            const topItem = remainingItems[0];
            if (topItem) cardRefs.current.get(topItem.id)?.swipeOut(1);
          }}
        >♥</button>
      </div>
    </div>
  );
}
