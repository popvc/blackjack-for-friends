import { useState } from "react";
import "./style.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id="center">
        <div className="hero"></div>
        <div>
          <h1>Get started!!</h1>
          <button className="btn">Button</button>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary w-64 rounded-full"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <section id="spacer"></section>
    </>
  );
}

export default App;
