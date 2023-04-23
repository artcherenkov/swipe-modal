import "./styles.css";
import { animated, useSpring } from "@react-spring/web";
import { useDrag, useScroll } from "@use-gesture/react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import cn from "classnames";

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

export const Mk3 = () => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const modalState = useRef<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);


  const maxHeight = useMaxModalHeight(anchorRef);

  const getHeightForState = useCallback(
    (state: EState) => {
      const headerHeight = headerRef.current?.offsetHeight || 0;
      const contentHeight = contentRef.current?.offsetHeight || 0;

      const actualMaxHeight =
        contentHeight > maxHeight ? maxHeight : contentHeight;

      switch (state) {
        case EState.HIDDEN: {
          return -headerHeight;
        }
        case EState.HALF: {
          return -maxHeight / 2;
        }
        case EState.FULL: {
          return -actualMaxHeight;
        }
      }
    },
    [maxHeight]
  );


  const bind = useDrag(
    ({ active, movement: [, my], offset: [, oy] }) => {
      if (my < -70) {
        if (oy > getHeightForState(EState.HALF)) {
          modalState.current = EState.HALF;
        } else {
          modalState.current = EState.FULL;
        }
      } else if (my > 70) {
        if (oy < getHeightForState(EState.HALF)) {
          modalState.current = EState.HALF;
        } else {
          modalState.current = EState.HIDDEN;
        }
      }

      if (modalState.current > EState.HIDDEN) {
        document.body.style.overflow = "hidden";
        document.body.style.overscrollBehavior = "none";
      }

      if (swipeRef.current) {
        if (modalState.current === EState.FULL) {
          swipeRef.current.classList.add("swipe_scroll");
        } else {
          swipeRef.current.classList.remove("swipe_scroll");
        }
      }

      api.start({
        y: active ? oy : getHeightForState(modalState.current),
        immediate: false
      });
    },
    {
      filterTaps: true,
      from: () => [0, y.get()],
      rubberband: true
    }
  );

  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    api.start({ y: -headerHeight });
  }, []);

  const bindScroll = useScroll(({ event, direction: [, dy] }) => {
    if (!event.currentTarget || !swipeRef.current) {
      return;
    }

    // @ts-ignore
    if (event.currentTarget.scrollTop < -40 && dy < 1) {
      modalState.current = EState.HALF;
      swipeRef.current.classList.remove("swipe_scroll");
      api.start({ y: getHeightForState(EState.HALF) });
    }
  }, {});

  return (
    <div className="root">
      <div className="page-header" ref={anchorRef}></div>
      <div className="body">
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
        <div className="b"></div>
      </div>
      <animated.div
        className={cn("swipe", {})}
        {...bind()}
        {...bindScroll()}
        style={{ y, maxHeight }}
        ref={swipeRef}
      >
        <div className="wrapper" ref={contentRef}>
          <div className="header" ref={headerRef}></div>
          <div className="content-wrapper" ref={wrapperRef}>
            <div className="content">
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
              <div className="stub"></div>
            </div>
          </div>
        </div>
      </animated.div>
    </div>
  );
};
