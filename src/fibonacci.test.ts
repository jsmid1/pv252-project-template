import { fibonacci } from "./fibonacci.ts";

test("fibonacci-5", () => {
  expect(fibonacci(5)).toBe(5);
});

test("fibonacci-minus", () => {
  const will_throw = () => {
    fibonacci(-1);
  };
  expect(will_throw).toThrow("Cannot compute on negative numbers");
});
