import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { animated, useSpring } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";

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

  const bind = useGesture(
    {
      onDrag: ({ movement: [, my], offset: [, oy], cancel, active }) => {
        let nextState = state;

        const halfStateHeight = getHeightForState(
          ESwipeModalState.HALF,
          adaptiveMaxHeight
        );

        if (my < -70) {
          if (oy > halfStateHeight) {
            nextState = ESwipeModalState.HALF;
            onStateChange(nextState);
          } else {
            nextState = ESwipeModalState.FULL;
            onStateChange(nextState);
          }
          cancel();
        } else if (my > 70) {
          if (oy < halfStateHeight) {
            nextState = ESwipeModalState.HALF;
            onStateChange(nextState);
          } else {
            nextState = ESwipeModalState.HIDDEN;
            onStateChange(nextState);
          }
          cancel();
        }

        api.start({
          y: active ? oy : -getHeightForState(nextState, adaptiveMaxHeight),
          immediate: false,
        });
      },
    },
    {
      drag: {
        filterTaps: true,
        from: () => [0, y.get()],
        rubberband: true,
      },
    }
  );

  return (
    <animated.div
      className="swipe"
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
