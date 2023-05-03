import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import "./App.css";
import { ESwipeModalState, SwipeModalV2 } from "./components/SwipeModalV2";

const range = (count: number) => {
  const res = [];
  for (let i = 0; i < count; i++) {
    res.push(i);
  }

  return res;
};

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

function App() {
  const anchorRef = useRef<HTMLElement | null>(null);
  const [blocksCount, setBlocksCount] = useState(1);
  const [state, setState] = useState<ESwipeModalState>(ESwipeModalState.HIDDEN);

  useEffect(() => {
    anchorRef.current = document.getElementById("page-header");
  }, []);

  const maxHeight = useMaxModalHeight(anchorRef);

  useEffect(() => {
    console.log("state", state);
  }, [state]);

  const onStateChange = useCallback(
    (newState: ESwipeModalState) => {
      if (newState === state) {
        return;
      }
      setState(newState);
    },
    [state]
  );

  const getText = (state: ESwipeModalState) => {
    switch (state) {
      case ESwipeModalState.HIDDEN: {
        return "Закрыта";
      }
      case ESwipeModalState.HALF: {
        return "50/50";
      }
      case ESwipeModalState.FULL: {
        return "Открыта";
      }
    }
  };

  return (
    <>
      <div id="page-header" className="page-header">
        <div className="buttons">
          <button
            onClick={() =>
              setState(
                state === ESwipeModalState.FULL
                  ? ESwipeModalState.HIDDEN
                  : state + 1
              )
            }
          >
            Переключить стейт модалки: {getText(state)}
          </button>
          <div className="inline-buttons">
            <button onClick={() => setBlocksCount(blocksCount + 1)}>
              Добавить блок в модалку
            </button>
            <button onClick={() => setBlocksCount(1)}>Оставить 1 блок</button>
          </div>
        </div>
      </div>
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

      <SwipeModalV2 state={state} maxHeight={maxHeight}>
        <div>
          <div>
            {range(blocksCount).map((b) => (
              <div key={b} className="stub"></div>
            ))}
          </div>
        </div>
      </SwipeModalV2>
    </>
  );
}

export default App;
