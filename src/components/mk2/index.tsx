import "./styles.css";
import { animated, useSpring } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

enum EState {
  HIDDEN,
  HALF,
  FULL,
}
export const useMaxModalHeight = <T extends HTMLElement>(
  anchorRef: MutableRefObject<T | null>
) => {
  const [maxHeight, setMaxHeight] = useState(0);

  useEffect(() => {
    if (anchorRef.current) {
      const { offsetTop, offsetHeight } = anchorRef.current;
      setMaxHeight(window.innerHeight - offsetTop - offsetHeight);
    }
  }, [anchorRef.current?.offsetTop, anchorRef.current?.offsetHeight]);

  return maxHeight;
};

export const Mk2 = () => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const modalState = useRef<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const maxHeight = useMaxModalHeight(anchorRef);

  const getHeightForState = useCallback(
    (state: EState) => {
      const headerHeight = headerRef.current?.offsetHeight || 0;

      switch (state) {
        case EState.HIDDEN: {
          return 0;
        }
        case EState.HALF: {
          return -maxHeight / 2 + headerHeight;
        }
        case EState.FULL: {
          return -maxHeight + headerHeight;
        }
      }
    },
    [maxHeight]
  );

  const bind = useDrag(
    ({ active, movement: [, my], offset: [, oy], cancel, last }) => {
      console.log("my", my, "oy", oy, "modalState", modalState.current);
      console.log("maxHeight", maxHeight);

      if (modalState.current === EState.HIDDEN) {
        cancel();
      }

      if (my < -70) {
        if (modalState.current === EState.HALF) {
          modalState.current = EState.FULL;
          cancel();
        }
      } else if (my > 70) {
        if (oy < getHeightForState(EState.HALF)) {
          modalState.current = EState.HALF;
        } else {
          modalState.current = EState.HIDDEN;
        }
        cancel();
      }

      api.start({
        y: active ? oy : getHeightForState(modalState.current),
        immediate: false,
      });
    },
    { filterTaps: true, from: () => [0, y.get()], rubberband: true }
  );

  const onClick = () => {
    if (modalState.current === EState.HIDDEN) {
      modalState.current = EState.HALF;
      api.start({ y: getHeightForState(EState.HALF) });
    }
  };

  return (
    <div className="root">
      <div className="page-header" ref={anchorRef}></div>
      <animated.div className="swipe" {...bind()} style={{ y }}>
        <div className="header" onClick={onClick} ref={headerRef}></div>
        <div className="content"></div>
      </animated.div>
    </div>
  );
};
