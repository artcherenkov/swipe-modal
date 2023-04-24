import "./styles.css";
import { animated, useSpring } from "@react-spring/web";
import { Handler, useGesture } from "@use-gesture/react";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
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

  const schetRef = useRef<HTMLSpanElement>(null);

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

  let dragMy = 0;
  let elScroll: undefined | number = undefined;

  const toggleBodyScroll = (isLocked: boolean) => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.overscrollBehavior = "auto";
    }
  };

  const dragFn: Handler<
    "drag",
    PointerEvent | MouseEvent | TouchEvent | KeyboardEvent
  > = ({ cancel, active, movement: [, my], offset: [, oy] }) => {
    dragMy = my;

    if (elScroll && elScroll > 10) {
      cancel();
    }

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

    toggleBodyScroll(modalState.current > EState.HIDDEN);

    const scrollCondition = elScroll === undefined || elScroll < 5;
    const isFullMode = modalState.current === EState.FULL;

    const dragMyPrintValue = Math.trunc(dragMy);
    const elScrollPrintValue =
      elScroll === undefined ? "undefined" : Math.trunc(elScroll);

    const isFullPrintValue = modalState.current;

    schetRef.current.textContent = `my: ${dragMyPrintValue}\nscrollTop: ${elScrollPrintValue}\nisFull ${isFullPrintValue}`;
    if (isFullMode && dragMy > 0 && scrollCondition) {
      modalState.current = EState.HALF;
      swipeRef.current?.classList.remove("swipe_scroll");
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
      immediate: false,
    });
  };

  const scrollFn: Handler<"scroll", UIEvent> = ({ event }) => {
    const target = event.currentTarget as HTMLElement;
    const scrollTop = target.scrollTop;

    elScroll = scrollTop === undefined ? elScroll : scrollTop;

    const isFullMode = modalState.current === EState.FULL;
    const isAtTheTop = elScroll === undefined || elScroll === 0;
    const isSwipeToBottom = dragMy > 0;

    // если скролл где-то внизу, считаем, что жест не активен
    if (scrollTop !== 0) {
      dragMy = 0;
    }

    if (isFullMode && isSwipeToBottom && isAtTheTop) {
      modalState.current = EState.HALF;
      swipeRef.current?.classList.remove("swipe_scroll");
      api.start({
        y: getHeightForState(modalState.current),
        immediate: false,
      });
    }
  };

  const bind = useGesture(
    {
      onDrag: dragFn,
      onScroll: scrollFn,
    },
    {
      drag: {
        filterTaps: true,
        from: () => [0, y.get()],
        rubberband: true,
      },
      scroll: {
        filterTaps: true,
        from: () => [0, y.get()],
      },
    }
  );
  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    api.start({ y: -headerHeight });
  }, []);

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
      <span id="schet" ref={schetRef}></span>
    </div>
  );
};
