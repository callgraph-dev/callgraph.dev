import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "../../store";

import { decrement, increment } from "./counterSlice";

export function Counter() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div
      style={{
        width: "90%",
        padding: "10px",
        margin: "50px 0",
        position: "absolute",
        zIndex: 1000,
      }}
    >
      <div>
        <button
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          Increment
        </button>
        <span>{count}</span>
        <button
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
