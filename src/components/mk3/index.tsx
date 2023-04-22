import "./styles.css";
import { animated, useSpring } from "@react-spring/web";
import { useDrag, useGesture, useScroll } from "@use-gesture/react";
import {
  disableBodyScroll,
  enableBodyScroll,
  clearAllBodyScrollLocks,
} from "body-scroll-lock";
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

const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

export const Mk3 = () => {
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const modalState = useRef<number>(0);
  const anchorRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const wrap = (nextValue, fn) => {
    let prevValue: undefined | number = undefined;

    const cb = () => {
      if (nextValue === prevValue) {
        return;
      }

      modalState.current = nextValue;
      prevValue = nextValue;
    };

    cb();
  };

  const swipeRef = useRef(null);

  const bind = useDrag(
    ({ active, movement: [, my], offset: [, oy], cancel, last }) => {
      if (
        modalState.current === EState.HIDDEN ||
        (modalState.current === EState.FULL && my < 0)
      ) {
        cancel();
      }

      if (my < -70) {
        if (modalState.current === EState.HALF) {
          swipeRef.current.classList.add("swipe_scroll");
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
    {
      filterTaps: true,
      from: () => [0, y.get()],
      rubberband: true,
    }
  );

  useEffect(() => {
    const headerHeight = headerRef.current?.offsetHeight || 0;
    api.start({ y: -headerHeight });
  }, []);

  const onClick = () => {
    if (modalState.current === EState.HIDDEN) {
      modalState.current = EState.HALF;
      api.start({ y: getHeightForState(EState.HALF) });
    }
  };

  const call = () => {
    console.log(modalState.current);
  };

  const [{ scrollY }, scrollApi] = useSpring(() => ({ scrollY: 0 }));
  const bindScroll = useGesture({
    onScroll: ({
      event,
      direction: [, dy],
      velocity: [, vy],
      ...sharedState
    }) => {
      console.log("scr", event.currentTarget?.scrollTop);
      document.getElementById("schet")!.textContent =
        event.currentTarget?.scrollTop +
        " /\n" +
        vy +
        " /\n" +
        swipeRef.current.classList.contains("swipe_scroll");
      if (event.currentTarget?.scrollTop < -40 && dy < 1) {
        swipeRef.current.classList.remove("swipe_scroll");
        api.start({ y: getHeightForState(EState.HALF) });
      }
    },
  });

  console.log(scrollY.get());

  useEffect(() => {
    if (!swipeRef.current) {
      return;
    }
  }, []);

  return (
    <div className="root">
      <div className="page-header" ref={anchorRef}></div>
      <div className="body">
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
          <div className="header" onClick={onClick} ref={headerRef}></div>
          <div className="content-wrapper" ref={wrapperRef}>
            <div className="content"></div>
          </div>
        </div>
      </animated.div>
      <span id="schet"></span>
    </div>
  );
};
