import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { EState, SwipeModal } from "./components/SwipeModal";
import "./App.css";

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
  const [state, setState] = useState<EState>(0);

  useEffect(() => {
    anchorRef.current = document.getElementById("page-header");
  }, []);

  const maxHeight = useMaxModalHeight(anchorRef);

  useEffect(() => {
    console.log("state", state);
  }, [state]);

  const onStateChange = useCallback(
    (newState: EState) => {
      if (newState === state) {
        return;
      }
      setState(newState);
    },
    [state]
  );

  const getText = (state: EState) => {
    switch (state) {
      case EState.HIDDEN: {
        return "Закрыта";
      }
      case EState.HALF: {
        return "50/50";
      }
      case EState.FULL: {
        return "Открыта";
      }
    }
  };

  return (
    <>
      <div id="page-header" className="page-header">
        <div className="buttons">
          <button onClick={() => setState(state === 2 ? 0 : state + 1)}>
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

      <SwipeModal
        state={state}
        maxHeight={maxHeight}
        onStateChange={onStateChange}
      >
        <div>
          {range(blocksCount).map((b) => (
            <div key={b} className="stub"></div>
          ))}
        </div>
      </SwipeModal>
    </>
  );
}

export default App;
