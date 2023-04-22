import "./styles.css";
import { animated, useSpring } from "@react-spring/web";
import { useDrag, useGesture, useScroll } from "@use-gesture/react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import cn from "classnames";

export const Mk4 = () => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));
  const headerRef = useRef<HTMLDivElement>(null);

  const modalState = useRef<number>(0);

  let currentPos = 0;

  const nextStep = () => {};

  const bind = useDrag(
    ({
      active,
      movement: [, my],
      offset: [, oy],
      cancel,
      last,
      velocity: [, vy],
    }) => {
      console.log("vy", vy, "my", my);
      if (my < -70) {
        api.start({ y: -600 });
        cancel();
        return;
      }
      api.start({ y: active ? oy : currentPos });
    },
    {
      filterTaps: true,
      from: () => [0, y.get()],
      // rubberband: true,
    }
  );

  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    api.start({ y: -headerHeight });
  }, []);

  return (
    <div className="root">
      <div className="page-header"></div>
      <div className="body">
        <div className="b"></div>
      </div>
      <animated.div className={cn("swipe", {})} {...bind()} style={{ y }}>
        <div className="wrapper">
          <div className="header" ref={headerRef}></div>
          <div className="content-wrapper">
            <div className="content" />
          </div>
        </div>
      </animated.div>
    </div>
  );
};
