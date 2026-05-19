import { forwardRef, useImperativeHandle } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import "../styles/SwipeCard.css";

const SwipeCard = forwardRef(({ item, onSwipe, isTop, stackIndex }, ref) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-150, 150], [-30, 30]);
  const yesOpacity = useTransform(x, [0, 80, 150], [0, 0.5, 1]);
  const noOpacity = useTransform(x, [-150, -80, 0], [1, 0.5, 0]);
  const bgColor = useTransform(
    x,
    [-150, 0, 150],
    ["rgba(255, 82, 82, 0.4)", "rgba(28, 31, 38, 0.65)", "rgba(105, 240, 174, 0.4)"]
  );

  useImperativeHandle(ref, () => ({
    swipeOut: (dir) => {
      animate(x, dir * 400, {
        duration: 0.15,
        ease: "easeOut",
        onComplete: () => onSwipe(dir > 0 ? "yes" : "no"),
      });
    }
  }));

  function handleDragEnd(_, info) {
    if (!isTop) return;
    const threshold = 130;

    if (Math.abs(info.offset.x) > threshold) {
      const dir = info.offset.x > 0 ? 1 : -1;
      animate(x, dir * 400, {
        duration: 0.15,
        ease: "easeOut",
        onComplete: () => onSwipe(dir > 0 ? "yes" : "no"),
      });
    }
  }

  // Stack effect: cards behind the top card are smaller and shifted down
  const stackStyle = {
    zIndex: 3 - (stackIndex || 0),
    scale: 1 - (stackIndex || 0) * 0.05,
    y: (stackIndex || 0) * 8,
    opacity: 1,
  };

  // Distinct initial state so undone cards fly down from above
  const initialStyle = {
    ...stackStyle,
    y: isTop ? -400 : stackStyle.y + 20,
    opacity: 0,
  };

  return (
    <motion.div
      className="swipe-card"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      style={{ x, rotate, backgroundColor: bgColor }}
      onDragEnd={handleDragEnd}
      initial={initialStyle}
      animate={stackStyle}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      whileDrag={{ cursor: "grabbing" }}
    >
      {/* Directional overlays */}
      <motion.div className="overlay overlay-yes" style={{ opacity: yesOpacity }}>
        LOVE
      </motion.div>
      <motion.div className="overlay overlay-no" style={{ opacity: noOpacity }}>
        NOPE
      </motion.div>

      <img src={item.image_url} alt={item.label} className="card-image" draggable={false} />
      <div className="card-content">
        <h2>{item.label}</h2>
        <p>{item.description}</p>
      </div>
    </motion.div>
  );
});

export default SwipeCard;
