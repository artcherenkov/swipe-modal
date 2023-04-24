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

  // для прокидывания текущего drag movementY в событие скролла
  let currentDragMy = 0;
  // для прокидывания текущего положения скролла в событие дрэга
  let currentScroll: undefined | number = undefined;

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

  /**
   * Функция для блокировки pull-to-refresh в мобильных браузерах.
   * @param isLocked нужно ли включить блокировку.
   */
  const toggleDocumentBodyScroll = (isLocked: boolean) => {
    if (isLocked) {
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    } else {
      document.body.style.overflow = "auto";
      document.body.style.overscrollBehavior = "auto";
    }
  };

  /**
   * Функция для закрытия модалки при свайпе. Может вызываться в двух местах:
   * в обработчике дрэга и скролла. В случае вызова из обработчика скролла
   * нужно принудительно вызывать gesture API, чтобы свернуть модалку.
   * @param invokeGestureApi параметр для принудительного вызова gesture API
   */
  const closeModalOnSwipe = (invokeGestureApi = false) => {
    const isFullMode = modalState.current === EState.FULL;
    const isAtTheTop = currentScroll === undefined || currentScroll <= 0;
    const isSwipeToBottom = currentDragMy > 0;

    if (isFullMode && isSwipeToBottom && isAtTheTop) {
      modalState.current = EState.HALF;
      swipeRef.current?.classList.remove("swipe_scroll");

      if (invokeGestureApi) {
        api.start({
          y: getHeightForState(modalState.current),
          immediate: false,
        });
      }
    }
  };

  /**
   * Функция для добавления/удаления CSS-класса, отвечающего за возможность
   * скролла модалки.
   */
  const handleAddingScrollClassname = () => {
    if (!swipeRef.current) {
      return;
    }

    if (modalState.current === EState.FULL) {
      swipeRef.current.classList.add("swipe_scroll");
    } else {
      swipeRef.current.classList.remove("swipe_scroll");
    }
  };

  const dragFn: Handler<
    "drag",
    PointerEvent | MouseEvent | TouchEvent | KeyboardEvent
  > = ({ cancel, active, movement: [, my], offset: [, oy] }) => {
    currentDragMy = my;

    if (currentScroll && currentScroll > 10) {
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

    toggleDocumentBodyScroll(modalState.current > EState.HIDDEN);
    closeModalOnSwipe();
    handleAddingScrollClassname();

    api.start({
      y: active ? oy : getHeightForState(modalState.current),
      immediate: false,
    });
  };

  const scrollFn: Handler<"scroll", UIEvent> = ({ event }) => {
    const target = event.currentTarget as HTMLElement;
    const scrollTop = target.scrollTop;

    // На андроиде скролл элемента становится undefined, если он остановился в любом месте.
    // В коде считается, что если скролл = undefined, то модалка не скроллилась вообще.
    // Если сработал этот обработчик, значит скролл был, поэтому записываем в глобальную переменную
    // последнее значение скролла
    currentScroll = scrollTop === undefined ? currentScroll : scrollTop;

    closeModalOnSwipe(true);

    // если скролл где-то внизу, считаем, что жест не активен
    // нужно, чтобы не закрывать модалку, пока скролл не в верхнем положении
    if (scrollTop !== 0) {
      currentDragMy = 0;
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
        className="swipe"
        ref={swipeRef}
        style={{ y, maxHeight }}
        {...bind()}
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
