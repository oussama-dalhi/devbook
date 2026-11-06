import { Button } from '@/components/ui/button';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const handleCount = () => {
    setCount((prev) => prev + 1);
  };
  const handleReset = () => {
    setCount(0);
  };

  return (
    <div>
      <Button className="py-10 w-130" onClick={handleCount}>
        {count}
      </Button>
      <Button
        onClick={handleReset}
        className="mx-3 w-30 py-5 px-3"
        variant="destructive"
      >
        Reset
      </Button>
    </div>
  );
}

export default App;
