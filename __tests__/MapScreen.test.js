import MapScreen from "../screens/MapScreen";

describe("MapScreen", () => {
  it("should be defined", () => {
    expect(MapScreen).toBeDefined();
  });

  it("should be a function or component", () => {
    expect(typeof MapScreen).toBe("function");
  });
});
