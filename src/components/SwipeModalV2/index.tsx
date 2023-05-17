import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { Handler, useGesture } from "@use-gesture/react";

import "./styles.css";

export enum ESwipeModalState {
  HIDDEN,
  HALF,
  FULL,
}

interface IProps {
  children: React.ReactElement;
  state: ESwipeModalState;
  maxHeight: number;

  onStateChange(state: ESwipeModalState): void;
}

interface IUseHeightForStateProps {
  maxHeight: number;
}

interface IUseAdaptiveMaxHeight {
  maxHeight: number;
  adaptiveHeight: boolean;
  ref: MutableRefObject<HTMLDivElement | null>;
}

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

const useElementHeight = ({
  ref,
}: {
  ref: MutableRefObject<HTMLDivElement | null>;
}) => {
  const [height, setHeight] = useState(0);

  React.useEffect(() => {
    const element = ref?.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return height;
};

const useAdaptiveMaxHeight = ({
  adaptiveHeight,
  maxHeight,
  ref,
}: IUseAdaptiveMaxHeight) => {
  const elementHeight = useElementHeight({ ref });
  return adaptiveHeight ? elementHeight : maxHeight;
};

const useHeightForState = ({ maxHeight }: IUseHeightForStateProps) => {
  let height = 0;

  const getHeightForState = (
    state: ESwipeModalState,
    adaptiveMaxHeight: number
  ) => {
    switch (state) {
      case ESwipeModalState.HIDDEN:
        height = 0;
        break;
      case ESwipeModalState.HALF:
        height = maxHeight / 2;
        break;
      case ESwipeModalState.FULL:
        if (adaptiveMaxHeight < maxHeight / 2) {
          height = maxHeight / 2;
        } else {
          height = adaptiveMaxHeight;
        }
        break;
    }

    return height > maxHeight ? maxHeight : height;
  };

  return { getHeightForState };
};

export const SwipeModalV2 = (props: IProps) => {
  const { children, state, maxHeight, onStateChange } = props;
  const adaptiveHeight = true;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const swipeRef = useRef<HTMLDivElement>(null);

  // для прокидывания текущего drag movementY в событие скролла
  let currentDragMy = 0;
  // для прокидывания текущего положения скролла в событие дрэга
  let currentScroll: undefined | number = undefined;

  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const { getHeightForState } = useHeightForState({ maxHeight });

  const adaptiveMaxHeight = useAdaptiveMaxHeight({
    maxHeight,
    adaptiveHeight,
    ref: contentRef,
  });

  useEffect(() => {
    api.start({ y: -getHeightForState(state, adaptiveMaxHeight) });
  }, [state, adaptiveMaxHeight]);

  /**
   * Функция для добавления/удаления CSS-класса, отвечающего за возможность
   * скролла модалки.
   */
  const handleAddingScrollClassname = () => {
    if (!swipeRef.current) {
      return;
    }

    if (state === ESwipeModalState.FULL) {
      swipeRef.current.classList.add("swipe_scroll");
    } else {
      swipeRef.current.classList.remove("swipe_scroll");
    }
  };

  /**
   * Функция для закрытия модалки при свайпе. Может вызываться в двух местах:
   * в обработчике дрэга и скролла. В случае вызова из обработчика скролла
   * нужно принудительно вызывать gesture API, чтобы свернуть модалку.
   * @param invokeGestureApi параметр для принудительного вызова gesture API
   */
  const closeModalOnSwipe = (invokeGestureApi = false) => {
    const isFullMode = state === ESwipeModalState.FULL;
    const isAtTheTop = currentScroll === undefined || currentScroll <= 0;
    const isSwipeToBottom = currentDragMy > 0;

    console.log(
      "isFullMode",
      isFullMode,
      "isSwipeToBottom",
      isSwipeToBottom,
      "isAtTheTop",
      isAtTheTop
    );

    if (isFullMode && isSwipeToBottom && isAtTheTop) {
      const nextState = ESwipeModalState.HALF;

      onStateChange(nextState);
      swipeRef.current?.classList.remove("swipe_scroll");

      if (invokeGestureApi) {
        api.start({
          y: getHeightForState(nextState, adaptiveMaxHeight),
          immediate: false,
        });
      }
    }
  };

  const dragFn: Handler<
    "drag",
    PointerEvent | MouseEvent | TouchEvent | KeyboardEvent
  > = ({ movement: [, my], offset: [, oy], cancel, active }) => {
    let nextState = state;
    currentDragMy = my;

    const halfStateHeight = getHeightForState(
      ESwipeModalState.HALF,
      adaptiveMaxHeight
    );

    if (my < -70) {
      if (oy > -halfStateHeight) {
        nextState = ESwipeModalState.HALF;
        onStateChange(nextState);
      } else {
        nextState = ESwipeModalState.FULL;
        onStateChange(nextState);
      }
      cancel();
    } else if (my > 70) {
      if (oy < -halfStateHeight) {
        nextState = ESwipeModalState.HALF;
        onStateChange(nextState);
      } else {
        nextState = ESwipeModalState.HIDDEN;
        onStateChange(nextState);
      }
      cancel();
    }

    toggleDocumentBodyScroll(nextState > ESwipeModalState.HIDDEN);
    closeModalOnSwipe();
    handleAddingScrollClassname();

    api.start({
      y: active ? oy : -getHeightForState(nextState, adaptiveMaxHeight),
      immediate: false,
    });
  };

  const scrollFn: Handler<"scroll", UIEvent> = ({ event }) => {
    const target = event.currentTarget as HTMLElement | null;
    console.log("wtf");

    if (!target) {
      return;
    }

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

  return (
    <animated.div
      className="swipe"
      ref={swipeRef}
      {...bind()}
      style={{
        y,
        height: getHeightForState(ESwipeModalState.FULL, adaptiveMaxHeight),
      }}
    >
      <div className="wrapper">
        <div ref={contentRef}>
          <div className="header"></div>
          <div className="content">{children}</div>
        </div>
      </div>
    </animated.div>
  );
};
